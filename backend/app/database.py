import os
import pymysql
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure PyMySQL to be used as a drop-in replacement for MySQLdb
pymysql.install_as_MySQLdb()

def get_db_connection():
    """Create and return a connection to the MySQL database."""
    try:
        connection = pymysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', 3306)),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'password'),
            database=os.getenv('DB_NAME', 'swach_village'),
            cursorclass=pymysql.cursors.DictCursor,
            # Allow for fallback to older authentication methods if needed
            client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
        )
        return connection
    except pymysql.Error as e:
        print(f"Database connection error: {e}")
        raise 