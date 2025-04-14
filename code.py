from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("TestApp").getOrCreate()
df = spark.createDataFrame([(1, "Alice"), (2, "Bob")], ["id", "name"])
df.show()


@app.route("/api/run_pyspark", methods=["POST"])
def run_pyspark():
    try:
        os.environ["JAVA_HOME"] = r"C:\Program Files\Java\jdk1.8.0_202"
        os.environ["PATH"] = os.environ["JAVA_HOME"] + r"\bin;" + os.environ["PATH"]


        code = request.form.get("code")
        manual_input = request.form.get("manualInput", "")

        if not code:
            return jsonify({"error": "❌ No PySpark code provided!"}), 400

        # Optional input
        if manual_input:
            code = f"manual_input = '''{manual_input}'''\n\n" + code

        # Setup output buffer
        output_buffer = StringIO()
        error_buffer = StringIO()

        # Create a SparkSession
        spark = SparkSession.builder.master("local[*]").appName("BigDataApp").getOrCreate()
        local_env = {"spark": spark}

        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(error_buffer):
            exec(code, local_env)

        spark.stop()

        return jsonify({
            "output": output_buffer.getvalue(),
            "error": error_buffer.getvalue(),
            "config": {
                "cluster": "local",
                "ip": "127.0.0.1",
                "port": "n/a",
                "user": "username guest",
                "password": "n/a"
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
