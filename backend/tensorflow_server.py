import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
from flask import Flask, request, jsonify
from PIL import Image
import skimage
from pymongo import MongoClient
from annoy import AnnoyIndex
import tensorflow as tf
from keras.models import load_model
import numpy as np
import threading
import base64
from io import BytesIO
from flask_cors import CORS
from bson.objectid import ObjectId

app = Flask(__name__)
cors = CORS(app, resources={r"/*": {"origins": "*"}})
# MONGO LOADING
MONGO_CLIENT = MongoClient('mongodb://localhost:27017/')
MONGO_DATABASE = MONGO_CLIENT['image_similarity']
MONGO_COLLECTION = MONGO_DATABASE['image_objects']
# ANNOY LOADING
VECTOR_DB_OBJECT = AnnoyIndex(1000, 'euclidean')
# KERAS LOADING
#EMBEDDING_MODEL = tf.keras.applications.ConvNeXtTiny(input_shape=(256, 256, 3), include_top=False, pooling='max')
EMBEDDING_MODEL = load_model('./final_model.keras')
EMBEDDING_MODEL.compile(loss='category_crossentropy', metrics=['accuracy'], optimizer='adam')

IMAGE_IDS = []
IMAGE_VECTORS = []

def LOAD_IMAGES_TO_ANNOY():
    global VECTOR_DB_OBJECT
    global IMAGE_IDS
    global IMAGE_VECTORS
    global MONGO_COLLECTION
    IMAGE_IDS = []
    IMAGE_VECTORS = []
    VECTOR_DB_OBJECT = AnnoyIndex(1000, 'euclidean')
    for IMAGE_INDEX, IMAGE_DATA in enumerate(MONGO_COLLECTION.find()):
        IMAGE_IDS.append(IMAGE_DATA['_id'])
        IMAGE_VECTORS.append(np.array(IMAGE_DATA['imageVector']))
        VECTOR_DB_OBJECT.add_item(IMAGE_INDEX, IMAGE_DATA['imageVector'])
    VECTOR_DB_OBJECT.build(10)

def RESIZE_CONTAIN(imageMatrix, imageSize):
    height, width = imageMatrix.shape[0], imageMatrix.shape[1]
    if width > height:
        resizeFactor = imageSize/width
    else:
        resizeFactor = imageSize/height
    imageMatrix = skimage.transform.rescale(imageMatrix, resizeFactor, channel_axis=2, preserve_range=True)
    height, width = imageMatrix.shape[0], imageMatrix.shape[1]
    pad_width = imageSize - width
    pad_height = imageSize - height
    left = pad_width // 2
    right = pad_width - left
    top = pad_height // 2
    bottom = pad_height - top
    imageMatrix = np.pad(imageMatrix, ((top, bottom), (left, right), (0, 0)), constant_values=0)
    return imageMatrix

def IMAGE_EMBEDDING(image_b64):
    global EMBEDDING_MODEL
    base64_string = image_b64.split(",")[-1]
    image = Image.open(BytesIO(base64.b64decode(base64_string)))
    image_array = RESIZE_CONTAIN(np.array(image)[:,:,:3], 224)
    embedding_vector = EMBEDDING_MODEL(np.array([image_array]))[0]
    return [float(element) for element in embedding_vector]

def UPLOAD_TO_MONGODB(image_b64, image_vector):
    global VECTOR_DB_OBJECT
    global IMAGE_IDS
    global IMAGE_VECTORS
    global MONGO_COLLECTION
    uploaded_object = MONGO_COLLECTION.insert_one({'imageData': image_b64, 'imageVector': list(image_vector)})
    print('Uploaded successfully')
    LOAD_IMAGES_TO_ANNOY()

def CLOSEST_IMAGES(query_vector, closest_count):
    global VECTOR_DB_OBJECT
    global IMAGE_IDS
    global IMAGE_VECTORS
    closestIndices, closestDistances = VECTOR_DB_OBJECT.get_nns_by_vector(query_vector, closest_count, include_distances=True)
    closestImages = [IMAGE_IDS[IM_INDEX] for IM_INDEX in closestIndices]
    return dict(zip(closestImages, closestDistances))

@app.route('/objectCount', methods=['POST'])
def object_count():
    if VECTOR_DB_OBJECT is None:
        # Handle the case where VECTOR_DB_OBJECT is not initialized
        return jsonify({'totalCount': 0})
    return jsonify({'totalCount': VECTOR_DB_OBJECT.get_n_items()}), 200

@app.route('/uploadImage', methods=['POST'])
def upload_image():
    print('DataTriggered')
    data = request.json
    image_b64 = data['image']
    image_vector = IMAGE_EMBEDDING(image_b64)
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
    query_image_vector = IMAGE_EMBEDDING(query_image_b64)
    similar_indices, closest_distances = VECTOR_DB_OBJECT.get_nns_by_vector(query_image_vector, int(data['similarCount']), include_distances=True)
    responseList = []
    for similar_index, distance_metric in zip(similar_indices, closest_distances):
        responseList.append({
            'metric': distance_metric,
            'imageID': str(IMAGE_IDS[similar_index])
        })
    return jsonify(responseList), 200

if __name__ == '__main__':
    LOAD_IMAGES_TO_ANNOY()
    app.run(host='0.0.0.0', port=5000)
