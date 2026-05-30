import os
import struct

def make_silent_wav(duration_sec=0.5, sample_rate=22050):
    num_samples = int(duration_sec * sample_rate)
    data_size = num_samples * 2  # 16-bit = 2 bytes
    file_size = 36 + data_size
    
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        file_size,
        b'WAVE',
        b'fmt ',
        16,          # Subchunk1Size
        1,           # AudioFormat (PCM)
        1,           # NumChannels (Mono)
        sample_rate,
        sample_rate * 2,  # ByteRate
        2,           # BlockAlign
        16,          # BitsPerSample
        b'data',
        data_size
    )
    data = b'\x00' * data_size
    return header + data

def main():
    sounds = ['task_added', 'event_alert', 'success', 'warning', 'upload_complete']
    
    # Target directories
    assets_dir = os.path.join('assets', 'sounds')
    raw_dir = os.path.join('android', 'app', 'src', 'main', 'res', 'raw')
    
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(raw_dir, exist_ok=True)
    
    wav_content = make_silent_wav()
    
    for sound in sounds:
        # Write to assets
        asset_path = os.path.join(assets_dir, f'{sound}.wav')
        with open(asset_path, 'wb') as f:
            f.write(wav_content)
        print(f'Generated asset: {asset_path}')
        
        # Write to android res raw
        raw_path = os.path.join(raw_dir, f'{sound}.wav')
        with open(raw_path, 'wb') as f:
            f.write(wav_content)
        print(f'Generated android raw: {raw_path}')

if __name__ == '__main__':
    main()
