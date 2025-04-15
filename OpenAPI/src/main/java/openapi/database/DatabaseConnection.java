package openapi.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Database connection manager for SQL Server
 */
public class DatabaseConnection {
    // Update these with your database connection details
    private static final String JDBC_URL = "jdbc:sqlserver://localhost:1433;databaseName=test;trustServerCertificate=true";
    private static final String USERNAME = "sa";
    private static final String PASSWORD = "1234";
    
    private static Connection connection;
    
    /**
     * Get the database connection
     * @return Connection object
     * @throws SQLException if connection fails
     */
    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            try {
                Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
                connection = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD);
            } catch (ClassNotFoundException e) {
                throw new SQLException("SQL Server JDBC Driver not found", e);
            }
        }
        return connection;
    }
    
    /**
     * Close the database connection
     */
    public static void closeConnection() {
        if (connection != null) {
            try {
                connection.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}
