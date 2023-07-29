from __future__ import unicode_literals
import youtube_dl
import sys
sys.path.insert(1, '/youtube_dl/')

linkToVideo = sys.argv[1]
whereToDownload = sys.argv[2]


class MyLogger(object):
    def debug(self, msg):
        pass

    def warning(self, msg):
        pass

    def error(self, msg):
        print(msg)


def my_hook(d):
    if d['status'] == 'downloading':
        percent = d['_percent_str']
        print(percent)
    if d['status'] == 'finished':
        print('Done downloading, now converting ...')


ydl_opts = {
    'logger': MyLogger(),
    'progress_hooks': [my_hook],
    'outtmpl': whereToDownload+'\%(title)s'+'.mp4',
}
with youtube_dl.YoutubeDL(ydl_opts) as ydl:
    ydl.download([linkToVideo])
