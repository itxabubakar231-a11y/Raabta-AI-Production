if __name__ == "__main__":
    import os
    if os.path.exists("sample.m4a"):
        result = speech_to_text("sample.m4a")
        print(result)
    else:
        print("sample.m4a not found. Please place an audio file to test.")