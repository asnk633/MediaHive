use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub struct AppState {
    pub is_quitting: AtomicBool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            is_quitting: AtomicBool::new(false),
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                let state = window.state::<AppState>();
                if !state.is_quitting.load(Ordering::Relaxed) {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let toggle_i =
                MenuItem::with_id(app, "toggle", "Show/Hide Workspace", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        let state = app.state::<AppState>();
                        state.is_quitting.store(true, Ordering::Relaxed);
                        app.exit(0);
                    }
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                window.hide().unwrap();
                            } else {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                })
                .build(app)?;

            let args: Vec<String> = std::env::args().collect();
            if let Some(window) = app.get_webview_window("main") {
                if args.iter().any(|arg| arg == "--autostart") {
                    window.hide().unwrap();
                } else {
                    window.show().unwrap();
                }
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                // Wait briefly to let the dev server initialize if starting up
                std::thread::sleep(std::time::Duration::from_millis(1500));

                if cfg!(debug_assertions) {
                    // Try to connect to the devUrl
                    if std::net::TcpStream::connect("127.0.0.1:3000").is_err() {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let error_html = include_str!("../error.html");
                            let encoded = urlencoding::encode(error_html);
                            let url = format!("data:text/html;charset=utf-8,{}", encoded);
                            let _ = window.navigate(url.parse().unwrap());
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
