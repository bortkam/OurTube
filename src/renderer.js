window.$ = window.jQuery = require('jquery');
const { ipcRenderer } = require('electron');

$(function() {
	ipcRenderer.send('request-mainprocess-load-settings');
});

ipcRenderer.on('request-renderprocess-default-folder-update', (event, arg) => {
	$('#defaultLocationField').val(arg);
});

ipcRenderer.on('request-renderprocess-default-theme-update', (event, arg) => {
	$('body').attr('data-bs-theme', arg);
	if (arg == 'dark') {
		$('#darkTheme').prop('checked',true);
	} else {
		$('#lightTheme').prop('checked',true);
	}
});

function isValidUrl(urlString) {
	let urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
	return !!urlPattern.test(urlString);
}

$('#urlField').on('input', function() {
	let Data = $('#urlField').val();
	if (isValidUrl(Data)) {
		$('#downloadButton').removeClass('disabled').addClass('enabled');
	} else {
		$('#downloadButton').removeClass('enabled').addClass('disabled');
	}
});

$('#clearButton').on('click', function() {
	$('#urlField').val('');
	$('#downloadButton').removeClass('enabled').addClass('disabled');
});

$('#pasteButton').on('click', async function() {
	let clipboard = await navigator.clipboard.readText()
	if (isValidUrl(clipboard)) {
		$('#downloadButton').removeClass('disabled').addClass('enabled');
	};
	$('#urlField').val(clipboard);
});

$('#downloadButton').on('click', function() {
	let Data = $('#urlField').val();
	if (isValidUrl(Data)) {
		ipcRenderer.send('request-mainprocess-download', Data);
	}
});

$('#folderPickerButton').on('click', function() {
	ipcRenderer.send('request-mainprocess-folder-picker');
});

$('#saveSettingsButton').on('click', function() {
	ipcRenderer.send('request-mainprocess-save-settings');
});

ipcRenderer.on('request-rendererprocess-download-status', (event, arg) => {
	$('#urlField').prop('readonly', arg);
	if (arg == true) {
		$('button').removeClass('enabled').addClass('disabled');
		$('#downloadingStatus').removeClass('invisible').addClass('visible');
	} else {
		$('button').removeClass('disabled').addClass('enabled');
		$('#downloadingStatus').removeClass('visible').addClass('invisible');
	}
});

$('[name="btnradio"]').on('click', function() {
	let theme;
	if ($('#lightTheme').prop('checked') == true) {
		theme = 'light';
	}
	else {
		theme = 'dark';
	}
	$('body').attr('data-bs-theme', theme);
	ipcRenderer.send('request-mainprocess-select-theme', theme);
});