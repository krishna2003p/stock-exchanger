from credentials import *

import mysql.connector
from mysql.connector import Error
import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), 'common_scripts'))
from enable_logging import print_log

# Create a connection pool
try:
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(
        pool_name="mypool",
        pool_size=5,
        pool_reset_session=True,
        host=MYSQL_HOST,
        database=MYSQL_DATABASE,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD
    )
    print_log("Connection pool created successfully")
except Error as e:
    print("Error while connecting to MySQL using Connection pool ", e)
    connection_pool = None

# Function to get a connection from the pool
def get_connection():
    try:
        connection = connection_pool.get_connection()
        if connection.is_connected():
            return connection
    except Error as e:
        print_log("Error while getting connection from pool ", e)
        return None
    
# Function to close the connection
def close_connection(connection):
    if connection.is_connected():
        connection.close()
        print_log("MySQL connection is closed")
    else:
        print_log("Connection is already closed or was never opened")
    return

