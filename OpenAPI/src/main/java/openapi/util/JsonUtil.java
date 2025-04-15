package openapi.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.text.SimpleDateFormat;
import java.util.Date;
import spark.Response;

/**
 * Utility class for handling JSON data
 */
public class JsonUtil {
    private static final Gson GSON = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .create();
    
    /**
     * Convert object to JSON
     * @param object Object to convert
     * @return JSON string
     */
    public static String toJson(Object object) {
        return GSON.toJson(object);
    }
    
    /**
     * Convert JSON to object
     * @param <T> Type of object
     * @param json JSON string
     * @param classOfT Class of object
     * @return Object of type T
     */
    public static <T> T fromJson(String json, Class<T> classOfT) {
        return GSON.fromJson(json, classOfT);
    }
    
    /**
     * Set JSON response
     * @param response Spark response object
     * @param statusCode HTTP status code
     * @return Response object
     */
    public static Response setJsonResponse(Response response, int statusCode) {
        response.status(statusCode);
        response.type("application/json");
        return response;
    }
    
    /**
     * Format a date to ISO string
     * @param date Date to format
     * @return Formatted date string
     */
    public static String formatDate(Date date) {
        if (date == null) {
            return null;
        }
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        return dateFormat.format(date);
    }
}
