from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from database.mongo_config import db  # MongoDB connection
import jwt
import subprocess
import datetime  # Execution logs
import requests
import json
import os, subprocess, uuid
from pyspark.sql import SparkSession
from io import StringIO
import contextlib
import tempfile
import sys
from werkzeug.utils import secure_filename
import glob

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)
app.config["SECRET_KEY"] = "63992f13e7ed15b32438c95f88796b57ddbba7ad997938905a73467b6f77ebb4"

spark_jar_dir = r"E:\spark-3.5.5\spark-3.5.5-bin-hadoop3\jars"  # 👈 Update this path if needed
# Get all JARs
jars = glob.glob(os.path.join(spark_jar_dir, "*.jar"))

# Correct JAVA_HOME (no trailing bin)
java_home = r"C:\Program Files (x86)\Java\jdk-1.8"
os.environ["JAVA_HOME"] = java_home

# Remove all duplicated or invalid entries from PATH
cleaned_path = []
seen = set()
for path_dir in os.environ["PATH"].split(";"):
    if path_dir and path_dir not in seen and "jdk-1.8\\bin\\bin" not in path_dir.lower():
        cleaned_path.append(path_dir)
        seen.add(path_dir)

# Prepend the correct Java bin path to the cleaned PATH
os.environ["PATH"] = os.path.join(java_home, "bin") + ";" + ";".join(cleaned_path)

BASE_URL = "http://cci-siscluster1.charlotte.edu:5002/v1/chat/completions"
MODEL_ID = "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"

# MongoDB Collections
users_collection = db["users"]
workflows_collection = db["workflows"]
execution_logs_collection = db["execution_logs"]  # ✅ New collection for execution logs

# ✅ User Registration API
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data["username"]
    password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    role = data["role"]

    if users_collection.find_one({"username": username}):
        return jsonify({"message": "❌ User already exists!"}), 400

    users_collection.insert_one({"username": username, "password": password, "role": role})
    return jsonify({"message": "✅ User registered successfully!"}), 201

# ✅ User Login API
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = users_collection.find_one({"username": data["username"]})

    if user and bcrypt.check_password_hash(user["password"], data["password"]):
        token = jwt.encode({
			'identity': user["username"],
			'role' : user["role"]
		}, app.config['SECRET_KEY'])
        print( user )
        userid = str(user["_id"])
        print( userid )
        return jsonify({"token": token, "role": user["role"], "userid": userid}), 200

    return jsonify({"message": "❌ Invalid credentials!"}), 401

# ✅ Get Logged-in User Info
# @app.route("/api/protected", methods=["GET"])
# def protected():
#     current_user = get_jwt_identity()
#     print("✅ Logged-in User:", current_user)
#     return jsonify(logged_in_as=current_user), 200

# ✅ Save a New Workflow (Only Instructors)
@app.route("/api/workflows", methods=["POST"])
def save_workflow():
    data = request.json
    print('CURRENT DATA')
    print( data )
    workflows_collection.insert_one(data)
    print('DATA SAVED');
    return jsonify({"message": "✅ Workflow saved successfully!"}), 201

# ✅ Query DeepSeek AI for PySpark Code
def query_model(user_input):
    headers = {"Content-Type": "application/json"}
    data = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": "You are a helpful AI assistant that generates PySpark code."},
            {"role": "user", "content": user_input}
        ]
    }

    try:
        response = requests.post(BASE_URL, headers=headers, data=json.dumps(data))
        response_json = response.json()
        return response_json["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"


# ✅ Generate PySpark Code Based on Workflow Nodes
def generate_pyspark_code(nodes, edges):
    """ Convert workflow into a structured prompt for PySpark code generation. """
    node_descriptions = []
    for node in nodes:
        label = node["data"].get("label", "Unnamed Node")
        statements = node["data"].get("statements", [])
        node_text = f"Node: {label}, Statements: {', '.join(statements)}"
        node_descriptions.append(node_text)
    
    edges_description = [f"{edge['source']} → {edge['target']}" for edge in edges]
    
    prompt = f"""
    Generate a PySpark workflow based on the following structure:
    Nodes:
    {chr(10).join(node_descriptions)}

    Edges (dependencies between nodes):
    {chr(10).join(edges_description)}

    Provide the PySpark code that executes these steps sequentially.
    """
    
    return query_model(prompt)

# ✅ Save a New Workflow (Only Instructors)
@app.route("/api/run_workflow", methods=["POST"])
def run_workflow():
    data = request.json
    workflow = data.get("workflow", {})  # ✅ Extract the workflow dictionary
    userid = data.get("userid", "unknown_user")  # ✅ Extract userid
    
    nodes = workflow.get("nodes", [])  # ✅ Extract nodes from the workflow
    edges = workflow.get("edges", [])  # ✅ Extract edges from the workflow

    if not nodes or not edges:
        return jsonify({"error": "❌ Invalid workflow data. Nodes or Edges missing."}), 400

    print(f"✅ Running workflow for user {userid} with {len(nodes)} nodes and {len(edges)} edges.")

    # ✅ Generate PySpark Code from Workflow
    pyspark_code = generate_pyspark_code(nodes, edges)
    print("Generated PySpark Code:\n", pyspark_code)

    # ✅ Save workflow execution data to MongoDB
    workflow_entry = {
        "userid": userid,
        "nodes": nodes,
        "edges": edges,
        "pyspark_code": pyspark_code,
        "status": "executed"
    }
    # workflows_collection.insert_one(workflow_entry)

    return jsonify({
        "message": "✅ Workflow executed successfully!",
        "pyspark_code": pyspark_code
    }), 201

def provide_code(nodes,edges):
    if not nodes or not edges:
        return jsonify({"error": "❌ Invalid workflow data. Nodes or Edges missing."}), 400

    print(f"✅ Running workflow for user with {len(nodes)} nodes and {len(edges)} edges.")

    # ✅ Generate PySpark Code from Workflow
    pyspark_code = generate_pyspark_code(nodes, edges)
    print("Generated PySpark Code:\n", pyspark_code)

    # ✅ Save workflow execution data to MongoDB
    workflow_entry = {
        "nodes": nodes,
        "edges": edges,
        "pyspark_code": pyspark_code,
        "status": "executed"
    }
    # workflows_collection.insert_one(workflow_entry)

    return jsonify({
        "message": "✅ Workflow executed successfully!",
        "pyspark_code": pyspark_code
    }), 201

# Chatbot route
@app.route("/api/chatbot", methods=["POST"])
def chatbot():
    data = request.json
    message = data.get("message")
    level = data.get("level", "beginner")  # default to beginner
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    if not message:
        return jsonify({"reply": "❌ No message provided."}), 400

    # Add workflow context if present
    workflow_context = ""
    if nodes and edges:
        code_snippet = provide_code(nodes, edges)
        if level == "beginner":
            workflow_context = (
                "\n\nThis is the student's workflow. Explain it step-by-step:\n"
                f"{code_snippet}"
            )
        else:
            workflow_context = (
                "\n\nGenerate clean PySpark code for the following workflow:\n"
                f"{code_snippet}"
            )

    # System prompt based on level
    system_prompt = (
        "You are an AI assistant for BigDataTutor. Your job is to help students understand data engineering, "
        "Spark workflows, and PySpark code.\n"
    )
    if level == "beginner":
        system_prompt += (
            "Explain everything simply, break it down step-by-step, and use analogies if needed. "
            "Assume the user is just starting out.\n"
        )
    else:
        system_prompt += (
            "Assume the user is advanced. Be concise and output only working PySpark code unless asked for more.\n"
        )

    # Final payload
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message + workflow_context}
        ],
        "max_tokens": 800,
        "temperature": 0.7,
        "top_p": 0.95
    }

    try:
        response = requests.post(BASE_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": f"❌ Error: {str(e)}"}), 500



# ✅ Get All Workflows (Accessible by Students & Instructors)
@app.route("/api/workflows", methods=["GET"])
def get_workflows():
    try:
        userid = request.args.get('userid')  # Replace 'param1' with the actual query parameter name
        print( request.args )
        # Fetch workflows
        workflows = list(workflows_collection.find({"userid": userid}))
        
        # Convert ObjectId to string for each workflow
        for workflow in workflows:
            workflow["_id"] = str(workflow["_id"])  # Convert _id to string
        # print("✅ Workflows Found:", workflows)

        return jsonify(workflows), 200
    except Exception as e:
        print("❌ Error in fetching workflows:", str(e))
        return jsonify({"message": "Error fetching workflows"}), 500

# ✅ Update a Workflow (Only Instructors)
@app.route("/api/workflows/<workflow_id>", methods=["PUT"])
def update_workflow(workflow_id):
    current_user = {"role": "student"}
    if current_user["role"] != "instructor":
        return jsonify({"message": "❌ Access Denied! Only Instructors can update workflows."}), 403

    data = request.json
    result = workflows_collection.update_one({"id": workflow_id}, {"$set": data})

    if result.matched_count == 0:
        return jsonify({"message": "❌ Workflow not found!"}), 404

    return jsonify({"message": "✅ Workflow updated successfully!"})

# ✅ Delete a Workflow (Only Instructors)
@app.route("/api/workflows/<workflow_id>", methods=["DELETE"])
def delete_workflow(workflow_id):
    current_user = {"role": "student"}
    if current_user["role"] != "instructor":
        return jsonify({"message": "❌ Access Denied! Only Instructors can delete workflows."}), 403

    result = workflows_collection.delete_one({"id": workflow_id})

    if result.deleted_count == 0:
        return jsonify({"message": "❌ Workflow not found!"}), 404

    return jsonify({"message": "✅ Workflow deleted successfully!"})

# ✅ Generate PySpark Code from Workflow
@app.route("/api/generate_spark", methods=["POST"])
def generate_spark():
    print('ENTER')
    token = None
    print( request.headers['Authorization'] )
    if 'Authorization' in request.headers:
        print(request.headers )
        token = request.headers['Authorization']
        token = token.split(" ")[1]
    if not token:
        return jsonify({'message' : 'Token is missing !!'}), 401
    print( token )
    try:
        print( 'DECODING' )
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except  Exception as e:
        print('INVALID KEY')
        print( e )
        return jsonify({'message' : 'Invalid Token!!'}), 401

    data = request.json
    print( data )
    nodes = data["nodes"]

    spark_code = """from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("WorkflowExecution").getOrCreate()
"""
    print( 'spark code' )
    for node in nodes:
        spark_code += f"# {node['data']['label']}\n"
        spark_code += "df = spark.read.csv('input.csv', header=True, inferSchema=True)\n"
        spark_code += "df.show()\n\n"
    print( "node" )

    return jsonify({"spark_code": spark_code})


@app.route("/api/run_pyspark", methods=["POST"])
def run_pyspark():
    try:
        # Set Java path (Update if needed)
        os.environ["JAVA_HOME"] = r"C:\Program Files\Java\jdk1.8.0_202"
        os.environ["PATH"] = os.environ["JAVA_HOME"] + r"\bin;" + os.environ["PATH"]

        # Get inputs
        code = request.form.get("code")
        manual_input = request.form.get("manualInput", "")
        language = request.form.get("language", "python").lower()
        uploaded_files = request.files.getlist("files")

        if not code:
            return jsonify({"error": "❌ No code provided!"}), 400

        # Setup upload folder
        upload_folder = "./uploads"
        os.makedirs(upload_folder, exist_ok=True)

        file_paths = []
        for file in uploaded_files:
            filename = secure_filename(file.filename)
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            file_paths.append(filepath)

        # Setup output buffers
        output_buffer = StringIO()
        error_buffer = StringIO()
        runtime_config = {}
        if language == "python":
            if manual_input:
                code = f"manual_input = '''{manual_input}'''\n\n" + code

            stdin_backup = sys.stdin
            sys.stdin = StringIO(manual_input)

            # Create SparkSession
            spark = SparkSession.builder.master("local[*]").appName("BigDataApp").getOrCreate()
            local_env = {"spark": spark, "uploaded_files": file_paths}

            with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(error_buffer):
                exec(code, local_env)

            sys.stdin = stdin_backup
            sc = spark.sparkContext
            runtime_config = {
                "cluster": sc.master,
                "ip": sc.getConf().get("spark.driver.host", "n/a"),
                "port": sc.getConf().get("spark.driver.port", "n/a"),
                "user": os.getlogin(),  # or use getpass.getuser()
                "applicationId": sc.applicationId,
                "uiUrl": sc.uiWebUrl or "n/a"
            }
            spark.stop()

        elif language == "java":
            try:
                print("📦 Java execution started")

                # Save code to .java file
                java_file = os.path.join(upload_folder, "TestApp.java")
                with open(java_file, "w") as f:
                    f.write(code)

                # Prepare classpath (Spark JARs + upload folder)
                spark_jar_dir = r"E:\spark-3.5.5\spark-3.5.5-bin-hadoop3\jars"  # 💡 Update this path if needed
                jars = glob.glob(os.path.join(spark_jar_dir, "*.jar"))
                classpath = os.pathsep.join(jars + [upload_folder])
                manual_input = manual_input.replace("\r\n", "\n").strip() + "\n"

                print("Manual input received:", repr(manual_input))

                # Compile Java code
                compile_proc = subprocess.run(
                    ["javac", "-cp", classpath, java_file],
                    input=manual_input,  
                    capture_output=True, text=True
                )

                if compile_proc.returncode != 0:
                    print(compile_proc.stderr)
                    return jsonify({"error": compile_proc.stderr}), 400

                # Run Java class
                run_proc = subprocess.run(
                    ["java", "-cp", classpath, "TestApp"],
                    input=manual_input,
                    capture_output=True, text=True
                )
                # After run_proc
                stderr_filtered = "\n".join(
                    line for line in run_proc.stderr.splitlines()
                    if not line.strip().startswith("INFO") and not line.strip().startswith("Using Spark's")
                )

                output_buffer.write(run_proc.stdout)
                error_buffer.write(stderr_filtered)

            except Exception as e:
                return jsonify({"error": f"Java runtime error: {str(e)}"}), 500

            # Clean up
            class_file = os.path.join(upload_folder, "TestApp.class")
            if os.path.exists(class_file):
                os.remove(class_file)
            os.remove(java_file)

        else:
            return jsonify({"error": f"Unsupported language: {language}"}), 400

        # Remove uploaded files
        for path in file_paths:
            os.remove(path)

        return jsonify({
            "output": output_buffer.getvalue(),
            "error": error_buffer.getvalue(),
            "config": {
                "cluster": "local",
                "ip": "127.0.0.1",
                "port": "n/a",
                "user": "username guest",
                "password": "n/a"
            },
            "another_config": runtime_config
        })

    except Exception as e:
        print("INSIDE EXCEPTION")
        print(e)
        return jsonify({"error": str(e)}), 500

# ✅ Execute Spark Code in a Local Cluster
@app.route("/api/execute_spark", methods=["POST"])
def execute_spark():
    data = request.json
    spark_code = data.get("spark_code")
    username = "username"

    script_path = "/tmp/workflow_script.py"
    with open(script_path, "w") as file:
        file.write(spark_code)

    try:
        result = subprocess.run(["spark-submit", script_path], capture_output=True, text=True)

        execution_log = {
            "username": username,
            "timestamp": datetime.datetime.utcnow(),
            "status": "Success" if result.returncode == 0 else "Failed",
            "output": result.stdout,
            "error": result.stderr
        }
        execution_logs_collection.insert_one(execution_log)  # ✅ Store execution logs

        return jsonify({"output": result.stdout, "error": result.stderr})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Retrieve Execution Logs
@app.route("/api/execution_logs", methods=["GET"])
def get_execution_logs():
    username = "test"
    logs = list(execution_logs_collection.find({"username": username}, {"_id": 0}))
    return jsonify(logs), 200

if __name__ == "__main__":
    app.run(debug=True)
