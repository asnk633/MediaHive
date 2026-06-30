use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Listener, Manager,
};
use tauri_plugin_deep_link::DeepLinkExt;

pub struct AppState {
    pub is_quitting: AtomicBool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _args, _cwd| {
            // No-op: deep-link listener handles re-focus for URL launches.
            // For non-URL second instances, the OS brings the existing window forward.
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
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_snap_layout::init().button_id("titlebar-maximize").build())
        .manage(AppState {
            is_quitting: AtomicBool::new(false),
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                let state = window.state::<AppState>();
                if !state.is_quitting.load(Ordering::Relaxed) {
                    if let Err(e) = window.hide() { log::error!("[window] hide() failed: {:?}", e); }
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .setup(|app| {
            #[cfg(desktop)]
            let _ = app.deep_link().register("mediahive");

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let toggle_i =
                MenuItem::with_id(app, "toggle", "Show/Hide Workspace", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().expect("No default window icon configured").clone())
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
                                if let Err(e) = window.hide() { log::error!("[tray toggle] hide() failed: {:?}", e); }
                            } else {
                                if let Err(e) = window.show() { log::error!("[tray toggle] show() failed: {:?}", e); }
                                if let Err(e) = window.set_focus() { log::error!("[tray toggle] set_focus() failed: {:?}", e); }
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
                                if let Err(e) = window.hide() { log::error!("[tray click] hide() failed: {:?}", e); }
                            } else {
                                if let Err(e) = window.show() { log::error!("[tray click] show() failed: {:?}", e); }
                                if let Err(e) = window.set_focus() { log::error!("[tray click] set_focus() failed: {:?}", e); }
                            }
                        }
                    }
                })
                .build(app)?;

            let args: Vec<String> = std::env::args().collect();
            if let Some(window) = app.get_webview_window("main") {
                if args.iter().any(|arg| arg == "--autostart") {
                    if let Err(e) = window.hide() { log::error!("[autostart] hide() failed: {:?}", e); }
                } else {
                    if let Err(e) = window.show() { log::error!("[autostart] show() failed: {:?}", e); }
                }
            }

            app.handle().plugin(
                tauri_plugin_log::Builder::default()
                    .level(if cfg!(debug_assertions) {
                        log::LevelFilter::Debug
                    } else {
                        log::LevelFilter::Warn
                    })
                    .build(),
            )?;

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(1500));

                if cfg!(debug_assertions) {
                    if std::net::TcpStream::connect("127.0.0.1:3000").is_err() {
                        let error_html = include_str!("../error.html");
                        let encoded = urlencoding::encode(error_html);
                        let url_str = format!("data:text/html;charset=utf-8,{}", encoded);
                        let app_inner = app_handle.clone();
                        let _ = app_handle.run_on_main_thread(move || {
                            if let Some(window) = app_inner.get_webview_window("main") {
                                match url_str.parse() {
                                    Ok(url) => { let _ = window.navigate(url); }
                                    Err(e) => log::error!("[debug] Error page URL parse failed: {:?}", e),
                                }
                            }
                        });
                    }
                }
            });

            // Deep-link listener: re-focus window on any mediahive:// URL
            let app_handle_dl = app.handle().clone();
            app.listen("deep-link://new-url", move |_event| {
                if let Some(window) = app_handle_dl.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
