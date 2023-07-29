let mainWindow;
let isDownloading = false;
let downloadLocation = '';
let theme;

// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Notification, nativeTheme } = require('electron');
const path = require('path');

const createWindow = () => {
  // Create the browser window.
	mainWindow = new BrowserWindow({
		width: 700,
		height: 500,
		minWidth: 500,
		minHeight: 500,
		webPreferences: {
			//preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true
  		}
	});
	// load the index.html of the app.
	mainWindow.loadFile('src/index.html');
	mainWindow.setMenuBarVisibility(false);
}

// This function is reading contents of settings.json and 
// substitutes json values into global variables
const loadSettings = () => {
	try {
		'use strict';
		const fs = require('fs');
		let rawdata = fs.readFileSync('settings.json');
		let settings = JSON.parse(rawdata);
		downloadLocation = String(settings.defaultLocation);
		if (String(settings.appTheme) == undefined) {
			theme = 'light';
		} else {
			theme = String(settings.appTheme);
			console.log(theme);
		}
	}
	 catch(err) {
		console.log('settings.json not found');
	}
}

// request from renderer.js to update view, when settings were loaded
ipcMain.on('request-mainprocess-load-settings', (event, arg) => {
	mainWindow.webContents.send('request-renderprocess-default-folder-update',downloadLocation);
	mainWindow.webContents.send('request-renderprocess-default-theme-update',theme);
});

// This method will be called when Electron has finished
app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
  	});
	loadSettings();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});


// this function is opening native folder picker to pick default download folder (downloadLocation)
const folderPicker = () =>  {
	dialog
	.showOpenDialog({
		properties: ['openFile', 'openDirectory'],
	})
	.then((result) => {
		if (result) {
			if (String(result.filePaths) == '') {
				return 0;
			}
			downloadLocation = String(result.filePaths).replaceAll('\\', '/');
			mainWindow.webContents.send('request-renderprocess-default-folder-update',downloadLocation);
			console.log(downloadLocation);
		}
	})
	.catch((err) => {
		console.log(err);
	});
}

// request from the renderer.js to open folder picker
ipcMain.on('request-mainprocess-folder-picker', () => {
	folderPicker();
});

// this function is meant to start the downloader.exe process
const download = (arg) => {
	if (isDownloading) return 0;

	isDownloading = true;
	mainWindow.webContents.send('request-rendererprocess-download-status', true); // request to renderer.js to show loading icon

	var spawn = require('child_process').spawn;
	//var pythonProcess = spawn('python', ['downloader.py',arg,downloadLocation]); 
	const args = [arg, downloadLocation];
	var pythonProcess = spawn('dist/downloader/downloader.exe',args);
		
	// this will enable downloader output to see in console
	// in future i will add download status percent in the UI
	/*
	pythonProcess.stdout.on('data', (data) => {
		const result = data.toString();
		console.log('python result:', result);
	});
	*/

	pythonProcess.on('close', (code) => {
		console.log('python exit code:', code);//
		isDownloading = false;
		mainWindow.webContents.send('request-rendererprocess-download-status', false);
		isFailure = code;

		if (isFailure) {
			console.log('error has occured');
			new Notification({
				title: 'Error!',
				body: `Something went wrong when downloading`
			}).show()
			return 0;
		}
		
		new Notification({
			title: 'Success!',
			body: `Your video has been downloaded!`
		}).show()
	});
}

// request from the renderer.js to start downloading 
ipcMain.on('request-mainprocess-download', (event, arg) => {
	download(arg);
});

const saveSettings = () => {
	'use strict';
	const fs = require('fs');
	let settings = { 
		defaultLocation: downloadLocation,
		appTheme: theme
	};
	let data = JSON.stringify(settings);
	fs.writeFileSync('settings.json', data);
	new Notification({
		title: 'Success!',
		body: `Settings were updated successfully`
	 }).show()
}

ipcMain.on('request-mainprocess-save-settings', (event, arg) => {
	saveSettings();
});

ipcMain.on('request-mainprocess-select-theme', (event, arg) => {
	theme = arg;
});