# Marketing Assets

## App Preview Videos (Apple App Store)

Apple requires App Preview videos to meet specific dimension and framerate requirements.
Use the following ffmpeg command to transcode any screen recording to a compliant format.

### iPhone 6.9" (required)

Resolution: 886×1920 (portrait)

```sh
ffmpeg -i input.mov \
  -vf scale=886:1920 \
  -r 30 \
  -c:v libx264 -b:v 10M \
  -c:a aac -b:a 256k \
  output.mp4
```

| Flag | Value | Purpose |
|------|-------|---------|
| `-vf scale=886:1920` | 886×1920 px | Scales to the required portrait resolution |
| `-r 30` | 30 fps | Apple's maximum allowed framerate |
| `-c:v libx264` | H.264 | Required video codec |
| `-b:v 10M` | 10 Mbps | High-quality video bitrate |
| `-c:a aac` | AAC | Required audio codec |
| `-b:a 256k` | 256 kbps | High-quality audio bitrate |

### Tips

- Record at native resolution on device, then downscale with the command above.
- Keep previews between 15–30 seconds (Apple's allowed range).
- The first frame is used as the poster image — make it visually representative.
- Remove or mute audio if the preview doesn't need it (`-an` flag instead of the `-c:a` flags).
