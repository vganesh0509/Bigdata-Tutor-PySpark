# from pymongo.mongo_client import MongoClient
# from pymongo.server_api import ServerApi


# # Create a global MongoDB client (Singleton Pattern)
# client = None

# if client is None:
#     client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
#     db = client["bigdatatutor"]
#     workflows_collection = db["workflows"]
    
#     # Print only if the connection is established for the first time
#     try:
#         client.admin.command('ping')
#         print("✅ Successfully connected to MongoDB Atlas!")
#     except Exception as e:
#         print("❌ Connection failed:", e)

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Updated URI - disables certificate checking via URI
#MONGO_URI="mongodb+srv://ganeshvasa72:Ganesh12@cluster0.mqyfpz8.mongodb.net/?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true"

MONGO_URI = "mongodb+srv://godak:Abcd123@cluster0.cqs7fql.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tlsAllowInvalidCertificates=true"

# Create a global MongoDB client (Singleton Pattern)
client = None

if client is None:
    client = MongoClient(
        MONGO_URI,
        server_api=ServerApi('1')
    )
    db = client["bigdatatutor"]
    workflows_collection = db["workflows"]

    try:
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print("❌ Connection failed:", e)
