import os
os.environ.setdefault("DISABLE_SQLALCHEMY_CEXT_RUNTIME", "1")  # pure-Python mode: avoids blocked .pyd files
