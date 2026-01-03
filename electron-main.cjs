const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "public/icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    frame: false,
    backgroundColor: "#0f172a",
  });

  const indexPath = path.join(__dirname, ".output/public/index.html");

  if (process.env.NODE_ENV === "development") {
    spawn("npm", ["run", "dev"], { stdio: "inherit" });
    setTimeout(() => {
      mainWindow.loadURL("http://localhost:3000");
    }, 3000);
  } else {
    mainWindow.loadFile(indexPath);
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
