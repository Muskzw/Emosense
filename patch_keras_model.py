import json
import zipfile
import shutil
import os

keras_path = "/home/elon/Downloads/emosense_model.keras"
temp_path = "/home/elon/Downloads/emosense_model_temp.keras"

print("--- EmoSense Keras Model Compatibility Patcher ---")

if not os.path.exists(keras_path):
    print(f"Error: Model file not found at {keras_path}")
    sys.exit(1)

try:
    # 1. Read config.json
    print("Reading model architecture from zip...")
    with zipfile.ZipFile(keras_path, 'r') as zin:
        config_data = zin.read('config.json').decode('utf-8')
        
    config_dict = json.loads(config_data)
    
    # 2. Recursively remove 'quantization_config'
    def clean_config(d):
        removed = 0
        if isinstance(d, dict):
            if 'quantization_config' in d:
                del d['quantization_config']
                removed += 1
            for k, v in d.items():
                removed += clean_config(v)
        elif isinstance(d, list):
            for item in d:
                removed += clean_config(item)
        return removed

    print("Stripping Keras 3 'quantization_config' fields...")
    fields_removed = clean_config(config_dict)
    print(f"Removed {fields_removed} incompatible fields.")
    
    new_config_data = json.dumps(config_dict).encode('utf-8')
    
    # 3. Create a patched zip
    print("Writing patched model archive...")
    with zipfile.ZipFile(keras_path, 'r') as zin:
        with zipfile.ZipFile(temp_path, 'w') as zout:
            for item in zin.infolist():
                if item.filename == 'config.json':
                    zout.writestr('config.json', new_config_data)
                else:
                    zout.writestr(item, zin.read(item.filename))
                    
    # 4. Overwrite original
    shutil.move(temp_path, keras_path)
    print("Model successfully patched for backwards compatibility!")
    
except Exception as e:
    print(f"Patcher Failed: {e}")
    if os.path.exists(temp_path):
        os.remove(temp_path)
