import yt_dlp

def download_youtube_video(url, output_path='../videos/'):
    ydl_opts = {
        'outtmpl': f'{output_path}/%(title)s.%(ext)s',  # Save as video title
        'format': 'best',  # Download the best quality
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

def download_audio(youtube_url, output_path='../audio'):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{output_path}/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])


if __name__ == "__main__":
    youtube_url = input("Enter YouTube video URL: ")
    # download_youtube_video(youtube_url)
    download_audio(youtube_url)
