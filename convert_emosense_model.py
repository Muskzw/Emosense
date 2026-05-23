import os
import sys
import shutil
from types import ModuleType

# Mock tensorflow_hub to avoid compatibility/dependency issues with TF 2.21+
mock_hub = ModuleType("tensorflow_hub")
sys.modules["tensorflow_hub"] = mock_hub

import numpy as np
# Bypass numpy's strict __getattr__ deprecation checks in NumPy 1.25+
for attr in ['object', 'bool', 'float', 'complex', 'str', 'int']:
    if attr in np.__dict__.get('__former_attrs__', {}):
        del np.__former_attrs__[attr]

np.object = object
np.bool = bool
np.int = int
np.float = float

import tensorflow as tf
import tensorflowjs as tfjs

keras_path = "/home/elon/Downloads/emosense_model.keras"
output_dir = "/home/elon/Documents/Emosense/frontend/public/models/emosense-model"
temp_saved_model_dir = "/home/elon/Documents/Emosense/temp_saved_model_base"

print("--- EmoSense Colab-Trained Model Conversion Tool ---")
print(f"TensorFlow version: {tf.__version__}")

if not os.path.exists(keras_path):
    print(f"Error: Keras model not found at {keras_path}")
    sys.exit(1)

try:
    print(f"Loading Keras model from {keras_path}...")
    model = tf.keras.models.load_model(keras_path)
    print("Model loaded successfully. Summary:")
    model.summary()
    
    # Clean up any existing temp directory
    if os.path.exists(temp_saved_model_dir):
        shutil.rmtree(temp_saved_model_dir)
        
    print("Exporting Keras model as native TF SavedModel...")
    tf.saved_model.save(model, temp_saved_model_dir)
    
    print(f"Converting and saving SavedModel to TFJS in {output_dir}...")
    os.makedirs(output_dir, exist_ok=True)
    tfjs.converters.convert_tf_saved_model(temp_saved_model_dir, output_dir)
    print("\nSuccessfully converted EmoSense Colab-trained model to TensorFlow.js!")
    print(f"Files saved in: {output_dir}")
    
except Exception as e:
    print(f"Failed to convert model: {str(e)}")
    
finally:
    # Clean up temp directory
    if os.path.exists(temp_saved_model_dir):
        shutil.rmtree(temp_saved_model_dir)
