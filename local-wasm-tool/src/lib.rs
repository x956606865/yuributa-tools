mod utils;
// use js_sys::*;
use wasm_bindgen::prelude::*;
use std::collections::HashMap;
use std::vec::Vec;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, local-wasm-tool!");
}

fn find_most_frequent_rgb(pixels: &[u8]) -> (Vec<i32>, f32, HashMap<String, i32>) {
    let p_length = pixels.len();
    let mut frequency_map: HashMap<String, i32> = HashMap::new();
    
    // Count the frequency of each RGB value
    for i in (0..p_length).step_by(4) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];
        let rgb = format!("{},{},{}", r, g, b);
        *frequency_map.entry(rgb).or_insert(0) += 1;
    }
    
    let entries: Vec<(&String, &i32)> = frequency_map.iter().collect();
    let (most_frequent_rgb, max_frequency) = entries.iter().fold(("", 0), |prev, curr| {
        if *curr.1 > prev.1 {
            (curr.0, *curr.1)
        } else {
            prev
        }
    });
    
    let rgb: Vec<i32> = most_frequent_rgb.split(',').map(|x| x.parse().unwrap()).collect();
    let frequency = max_frequency as f32 / (p_length as f32 / 4.0);
    
    (rgb, frequency, frequency_map)
}

#[wasm_bindgen]
pub fn fe_find_most_frequent_rgb(pixels: &[u8]) -> String {
    let p_length = pixels.len();
    let mut frequency_map: HashMap<String, i32> = HashMap::new();
    
    // Count the frequency of each RGB value
    for i in (0..p_length).step_by(4) {
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];
        let rgb = format!("{},{},{}", r, g, b);
        *frequency_map.entry(rgb).or_insert(0) += 1;
    }
    
    let entries: Vec<(&String, &i32)> = frequency_map.iter().collect();
    let (most_frequent_rgb, _max_frequency) = entries.iter().fold(("", 0), |prev, curr| {
        if *curr.1 > prev.1 {
            (curr.0, *curr.1)
        } else {
            prev
        }
    });
    
    // let rgb: Vec<i32> = most_frequent_rgb.split(',').map(|x| x.parse().unwrap()).collect();
    // let frequency = max_frequency as f32 / (p_length as f32 / 4.0);
    
    return String::from(most_frequent_rgb)
}

#[wasm_bindgen]
pub fn check_white_black(col: &[u8], white_threshold: i32, black_threshold: i32, at_least_frequency: f32) -> String {
    let (_,_,frequency_map) = find_most_frequent_rgb(col);
    let mut new_frequency_map: HashMap<String, i32> = HashMap::new();
    new_frequency_map.insert(String::from("white"), 0);
    new_frequency_map.insert(String::from("black"), 0);
    new_frequency_map.insert(String::from("other"), 0);
    
    for (key, value) in frequency_map.iter() {
        let rgb: Vec<i32> = key.split(',').map(|x| x.parse().unwrap()).collect();
        let r = rgb[0];
        let g = rgb[1];
        let b = rgb[2];
        
        if r >= white_threshold && g >= white_threshold && b >= white_threshold {
            *new_frequency_map.get_mut("white").unwrap() += value;
        } else if r <= black_threshold && g <= black_threshold && b <= black_threshold {
            *new_frequency_map.get_mut("black").unwrap() += value;
        } else {
            *new_frequency_map.get_mut("other").unwrap() += value;
        }
    }
    
    let white_frequency = *new_frequency_map.get("white").unwrap() as f32 / (new_frequency_map.get("black").unwrap() + new_frequency_map.get("white").unwrap() + new_frequency_map.get("other").unwrap()) as f32;
    let black_frequency = *new_frequency_map.get("black").unwrap() as f32 / (new_frequency_map.get("black").unwrap() + new_frequency_map.get("white").unwrap() + new_frequency_map.get("other").unwrap()) as f32;
    
    if white_frequency > at_least_frequency {
        return String::from("white");
    }
    
    if black_frequency > at_least_frequency {
        return String::from("black");
    }
    
    String::from("other")
}
