import { NextResponse } from "next/server";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const { message, source } = await request.json();
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${source}] ${message}\n`;

    // Write to a shared log file in the parent workspace directory
    const logFilePath = "D:\\MediaHive App\\auth_diagnostic_log.txt";
    
    // Append to file
    fs.appendFileSync(logFilePath, logLine, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to write diagnostic log:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const logFilePath = "D:\\MediaHive App\\auth_diagnostic_log.txt";
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
