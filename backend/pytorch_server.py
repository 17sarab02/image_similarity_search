import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
from flask import Flask, request, jsonify
from PIL import Image
import skimage
from pymongo import MongoClient
from annoy import AnnoyIndex
from transformers import AutoModel, AutoModelForImageClassification
import torch
import numpy as np
import base64
from torchvision import transforms
from io import BytesIO
from flask_cors import CORS
from bson.objectid import ObjectId

MODEL_PATH = './Transformers/dinov2.pt'

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
# MONGO LOADING
MONGO_CLIENT = MongoClient('mongodb://localhost:27017/')
MONGO_DATABASE = MONGO_CLIENT['image_similarity']
MONGO_COLLECTION = MONGO_DATABASE['image_objects']
# ANNOY LOADING
MODEL_PATH = 'facebook/dinov2-base'  # Adjust based on your chosen variant
VECTOR_DB_OBJECT_EUCLIDEAN = AnnoyIndex(768, 'euclidean')
VECTOR_DB_OBJECT_COSINE = AnnoyIndex(768, 'angular')
VECTOR_DB_OBJECT_MANHATTAN = AnnoyIndex(768, 'angular')

# DINO V2 MODEL LOADING (assuming pre-trained model is downloaded)
model = AutoModel.from_pretrained(MODEL_PATH)

IMAGE_IDS = []
IMAGE_VECTORS = []


class CustomResize(object):
    def __init__(self, size):
        self.size = size

    def __call__(self, image):
        width, height = image.size
        if width > height:
            new_width = self.size
            new_height = int(height * self.size / width)
        else:
            new_height = self.size
            new_width = int(width * self.size / height)
        return image.resize((new_width, new_height))
    
class CustomPad(object):
    def __init__(self, desired_size):
        self.desired_size = desired_size

    def __call__(self, image):
        width, height = image.size
        pad_width = self.desired_size - width
        pad_height = self.desired_size - height
        left = pad_width // 2
        right = pad_width - left
        top = pad_height // 2
        bottom = pad_height - top
        return transforms.functional.pad(image, (left, top, right, bottom), fill=0)

def LOAD_IMAGES_TO_ANNOY():
    global VECTOR_DB_OBJECT_EUCLIDEAN
    global VECTOR_DB_OBJECT_COSINE
    global VECTOR_DB_OBJECT_MANHATTAN
    global IMAGE_IDS
    global IMAGE_VECTORS
    global model

    IMAGE_IDS = []
    IMAGE_VECTORS = []
    VECTOR_DB_OBJECT_EUCLIDEAN = AnnoyIndex(768, 'euclidean')
    VECTOR_DB_OBJECT_COSINE = AnnoyIndex(768, 'angular')
    VECTOR_DB_OBJECT_MANHATTAN = AnnoyIndex(768, 'manhattan')
    for IMAGE_INDEX, IMAGE_DATA in enumerate(MONGO_COLLECTION.find()):
        IMAGE_IDS.append(str(IMAGE_DATA['_id']))
        IMAGE_VECTORS.append(np.array(IMAGE_DATA['imageVector']))
        VECTOR_DB_OBJECT_EUCLIDEAN.add_item(IMAGE_INDEX, IMAGE_DATA['imageVector'])
        VECTOR_DB_OBJECT_COSINE.add_item(IMAGE_INDEX, IMAGE_DATA['imageVector'])
        VECTOR_DB_OBJECT_MANHATTAN.add_item(IMAGE_INDEX, IMAGE_DATA['imageVector'])
    VECTOR_DB_OBJECT_EUCLIDEAN.build(10)
    VECTOR_DB_OBJECT_COSINE.build(10)
    VECTOR_DB_OBJECT_MANHATTAN.build(10)


def IMAGE_EMBEDDING(image_b64):
    global model

    base64_string = image_b64.split(",")[-1]
    image = Image.open(BytesIO(base64.b64decode(base64_string)))
    image_array = image.convert('RGB')  # Ensure RGB format
    image_array = CustomResize(256)(image_array)
    image_array = CustomPad(256)(image_array)
    preprocessed_image = transforms.ToTensor()(image_array)
    with torch.no_grad():
        outputs = model(preprocessed_image.expand((1, 3, 256, 256)))
        embedding_vector = outputs[1].squeeze()
    return embedding_vector.tolist()

def UPLOAD_TO_MONGODB(image_b64, image_vector):
    uploaded_object = MONGO_COLLECTION.insert_one({'imageData': image_b64, 'imageVector': list(image_vector)})
    print('Uploaded successfully')
    LOAD_IMAGES_TO_ANNOY()

def CLOSEST_IMAGES(query_vector, closest_count, parameter):
    global VECTOR_DB_OBJECT_EUCLIDEAN
    global VECTOR_DB_OBJECT_COSINE
    global IMAGE_IDS
    global IMAGE_VECTORS
    if(parameter == 'euclidean'):
        closestIndices, closestDistances = VECTOR_DB_OBJECT_EUCLIDEAN.get_nns_by_vector(query_vector, closest_count, include_distances=True)
    elif(parameter == 'manhattan'):
        closestIndices, closestDistances = VECTOR_DB_OBJECT_MANHATTAN.get_nns_by_vector(query_vector, closest_count, include_distances=True)
    else:
        closestIndices, closestDistances = VECTOR_DB_OBJECT_COSINE.get_nns_by_vector(query_vector, closest_count, include_distances=True)
    closestImages = [IMAGE_IDS[IM_INDEX] for IM_INDEX in closestIndices]
    return zip(closestImages, closestDistances)

@app.route('/objectCount', methods=['POST'])
def object_count():
    if VECTOR_DB_OBJECT_EUCLIDEAN is None:
        # Handle the case where VECTOR_DB_OBJECT is not initialized
        return jsonify({'totalCount': 0})
    return jsonify({'totalCount': VECTOR_DB_OBJECT_EUCLIDEAN.get_n_items()}), 200

@app.route('/uploadImage', methods=['POST'])
def upload_image():
    data = request.json
    image_b64 = data['image']
    image_vector = IMAGE_EMBEDDING(image_b64)
    print(len(image_vector))
    UPLOAD_TO_MONGODB(image_b64, image_vector)
    return jsonify({'message': 'Image uploaded successfully'}), 200

@app.route('/getImage', methods=['POST'])
def get_image():
    data = request.json
    image_id = data['imageID']
    image_metric = data['metric']
    image_data = MONGO_COLLECTION.find_one({'_id': ObjectId(image_id)})
    if image_data is None:
        return jsonify({'message': 'Image not found'}), 404
    image_b64 = image_data['imageData']
    return jsonify({'imageData': image_b64, 'metric': image_metric, 'imageID': image_id}), 200
    

@app.route('/getSimilar', methods=['POST'])
def get_similar():
    data = request.json
    query_image_b64 = data['image']
    query_parameter = data['parameter']
    query_image_vector = IMAGE_EMBEDDING(query_image_b64)
    responseList = []
    for object_id, distance_metric in CLOSEST_IMAGES(query_image_vector, data['similarCount'], query_parameter):
        responseList.append({
            'metric': distance_metric,
            'imageID': object_id
        })
    return jsonify(responseList), 200

if __name__ == '__main__':
    LOAD_IMAGES_TO_ANNOY()
    app.run(host='0.0.0.0', port=5000)
