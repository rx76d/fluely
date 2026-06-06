use cpal::traits::{DeviceTrait, HostTrait};
use ringbuf::HeapRb;

pub fn initialize_os_microphones() -> Result<cpal::Stream, String> {
    
    let host = cpal::default_host();
    let device = host.default_input_device().ok_or("No input device available")?;
    let config = device.default_input_config().map_err(|e| e.to_string())?;

    let rb = HeapRb::<f32>::new(16000 * 30);
    let (mut prod, _cons) = rb.split();

    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _: &_| {
            for &sample in data {
                let _ = prod.push(sample);
            }
        },
        |err| eprintln!("Audio stream error: {}", err),
        None
    ).map_err(|e| e.to_string())?;

    use cpal::traits::StreamTrait;
    stream.play().map_err(|e| e.to_string())?;
    println!("Native OS Microphone stream initialized successfully.");

    Ok(stream)
}
