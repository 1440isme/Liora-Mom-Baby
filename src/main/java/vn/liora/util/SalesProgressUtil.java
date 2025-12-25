package vn.liora.util;

/**
 * Utility class for calculating sales progress percentage
 * Synchronized with JavaScript logic in main.js and category-products.js
 */
public class SalesProgressUtil {
    
    /**
     * Calculate sales progress percentage using the same threshold logic as frontend
     * @param soldCount Number of items sold
     * @return Progress percentage (0-100)
     */
    public static double calculateProgress(int soldCount) {
        // EXACT same logic as JavaScript calculateSalesProgress method in category-products.js
        int[][] thresholds = {
            {50, 30},      // 0-50: 0-30% (tăng từ 20%)
            {100, 40},     // 50-100: 30-40%
            {500, 55},     // 100-500: 40-55%
            {1000, 70},    // 500-1000: 55-70%
            {5000, 85},    // 1000-5000: 70-85%
            {10000, 95},   // 5000-10000: 85-95%
            {Integer.MAX_VALUE, 100} // >10000: 95-100%
        };
        
        for (int i = 0; i < thresholds.length; i++) {
            int max = thresholds[i][0];
            int percentage = thresholds[i][1];
            
            if (soldCount <= max) {
                // Get previous threshold percentage - EXACT same as JS
                int basePercentage = (i > 0) ? thresholds[i-1][1] : 0;
                
                // Calculate progress within this threshold - EXACT same as JS
                int prevMax = (i > 0) ? thresholds[i-1][0] : 0;
                int range = max - prevMax;
                
                if (range > 0) {
                    // EXACT same calculation as JavaScript
                    double progress = ((double)(soldCount - prevMax) / range) * (percentage - basePercentage);
                    return Math.min(100.0, basePercentage + progress);
                } else {
                    return basePercentage;
                }
            }
        }
        
        return 100.0; // For very high sales
    }
}
