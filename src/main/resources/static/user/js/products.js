// Product Management System
class ProductManager {
    static products = [
        // Skincare Products
        {
            id: 'skin-001',
            name: 'Glow Deep Serum',
            brand: 'Beauty of Joseon',
            category: 'skincare',
            subcategory: 'serum',
            price: 17.00,
            originalPrice: 22.00,
            discount: 23,
            rating: 4.8,
            reviewCount: 2847,
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
            description: 'Alpha arbutin 2% + niacinamide for brighter, more even skin tone',
            ingredients: ['Alpha Arbutin', 'Niacinamide', 'Hyaluronic Acid'],
            isFeatured: true,
            isBestseller: true,
            isNewArrival: false,
            dateAdded: '2024-01-15'
        },
        {
            id: 'skin-002',
            name: 'Snail 96 Mucin Power Essence',
            brand: 'COSRX',
            category: 'skincare',
            subcategory: 'essence',
            price: 25.00,
            rating: 4.7,
            reviewCount: 1923,
            image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80',
            description: '96% snail secretion filtrate for hydration and skin repair',
            ingredients: ['Snail Secretion Filtrate', 'Sodium Hyaluronate'],
            isFeatured: true,
            isBestseller: true,
            isNewArrival: false,
            dateAdded: '2024-01-10'
        },
        {
            id: 'skin-003',
            name: 'Centella Unscented Serum',
            brand: 'Purito',
            category: 'skincare',
            subcategory: 'serum',
            price: 12.90,
            rating: 4.6,
            reviewCount: 1456,
            image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80',
            description: 'Soothing centella asiatica for sensitive and irritated skin',
            ingredients: ['Centella Asiatica Extract', 'Niacinamide', 'Peptides'],
            isFeatured: true,
            isBestseller: false,
            isNewArrival: true,
            dateAdded: '2024-03-01'
        },
        {
            id: 'skin-004',
            name: 'Low pH Good Morning Gel Cleanser',
            brand: 'COSRX',
            category: 'skincare',
            subcategory: 'cleanser',
            price: 12.00,
            rating: 4.5,
            reviewCount: 3421,
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
            description: 'Gentle morning cleanser with tea tree oil and BHA',
            ingredients: ['Tea Tree Leaf Oil', 'Betaine Salicylate'],
            isFeatured: false,
            isBestseller: true,
            isNewArrival: false,
            dateAdded: '2024-01-05'
        },
        {
            id: 'skin-005',
            name: 'Retinol 0.1% Cream',
            brand: 'The Ordinary',
            category: 'skincare',
            subcategory: 'treatment',
            price: 6.80,
            rating: 4.4,
            reviewCount: 892,
            image: 'https://images.unsplash.com/photo-1585652757173-57de5e9fab42?w=400&q=80',
            description: 'Gentle retinol formula for anti-aging and skin renewal',
            ingredients: ['Retinol', 'Squalane', 'Granactive Retinoid'],
            isFeatured: false,
            isBestseller: false,
            isNewArrival: true,
            dateAdded: '2024-03-15'
        },
        {
            id: 'skin-006',
            name: 'Hyaluronic Acid 2% + B5',
            brand: 'The Ordinary',
            category: 'skincare',
            subcategory: 'serum',
            price: 7.90,
            rating: 4.3,
            reviewCount: 2156,
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
            description: 'Multi-molecular hyaluronic acid complex for deep hydration',
            ingredients: ['Hyaluronic Acid', 'Vitamin B5', 'Sodium Hyaluronate'],
            isFeatured: true,
            isBestseller: false,
            isNewArrival: false,
            dateAdded: '2024-01-20'
        },

        // Makeup Products
        {
            id: 'make-001',
            name: 'Glass Skin Liquid Foundation',
            brand: 'Fenty Beauty',
            category: 'makeup',
            subcategory: 'foundation',
            price: 39.00,
            rating: 4.6,
            reviewCount: 1834,
            image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
            description: 'Medium-full coverage foundation for a natural glass skin finish',
            shades: ['Fair', 'Light', 'Medium', 'Tan', 'Deep'],
            isFeatured: true,
            isBestseller: true,
            isNewArrival: false,
            dateAdded: '2024-02-01'
        },
        {
            id: 'make-002',
            name: 'Cushion Compact Foundation',
            brand: 'Laneige',
            category: 'makeup',
            subcategory: 'foundation',
            price: 42.00,
            rating: 4.5,
            reviewCount: 967,
            image: 'https://images.unsplash.com/photo-1583241476582-c2ba5cc77e3f?w=400&q=80',
            description: 'Hydrating cushion foundation with SPF 25 PA++',
            shades: ['21 Natural Beige', '23 Sand Beige', '31 Dark Beige'],
            isFeatured: true,
            isBestseller: false,
            isNewArrival: true,
            dateAdded: '2024-03-10'
        },
        {
            id: 'make-003',
            name: 'Lip Sleeping Mask',
            brand: 'Laneige',
            category: 'makeup',
            subcategory: 'lip',
            price: 24.00,
            rating: 4.8,
            reviewCount: 3456,
            image: 'https://images.unsplash.com/photo-1586495985095-18dc49bf3269?w=400&q=80',
            description: 'Overnight lip treatment mask for soft, supple lips',
            flavors: ['Berry', 'Vanilla', 'Apple Lime', 'Grapefruit'],
            isFeatured: true,
            isBestseller: true,
            isNewArrival: false,
            dateAdded: '2024-01-25'
        },
        {
            id: 'make-004',
            name: 'Lip Tint Water Gel',
            brand: 'Peripera',
            category: 'makeup',
            subcategory: 'lip',
            price: 8.50,
            originalPrice: 12.00,
            discount: 29,
            rating: 4.4,
            reviewCount: 2189,
            image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80',
            description: 'Long-lasting water gel lip tint with vibrant color',
            shades: ['Cherry Pink', 'Coral Red', 'Berry Purple', 'Rose Pink'],
            isFeatured: false,
            isBestseller: true,
            isNewArrival: false,
            dateAdded: '2024-02-05'
        },
        {
            id: 'make-005',
            name: 'Ink Velvet Liquid Lipstick',
            brand: 'Peripera',
            category: 'makeup',
            subcategory: 'lip',
            price: 9.00,
            rating: 4.3,
            reviewCount: 1567,
            image: 'https://images.unsplash.com/photo-1586495985095-18dc49bf3269?w=400&q=80',
            description: 'Matte liquid lipstick with comfortable wear',
            shades: ['Dollish Beige Rose', 'Pure Peach', 'Celeb Deep Rose'],
            isFeatured: false,
            isBestseller: false,
            isNewArrival: true,
            dateAdded: '2024-03-08'
        },
        {
            id: 'make-006',
            name: 'Color Correcting Cushion',
            brand: 'Innisfree',
            category: 'makeup',
            subcategory: 'foundation',
            price: 28.00,
            rating: 4.2,
            reviewCount: 743,
            image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
            description: 'Natural coverage cushion with color correcting technology',
            shades: ['13 Light Beige', '21 Natural Beige', '23 True Beige'],
            isFeatured: false,
            isBestseller: false,
            isNewArrival: false,
            dateAdded: '2024-02-10'
        },

        // Additional Products for better variety
        {
            id: 'skin-007',
            name: 'Vitamin C 23% Suspension',
            brand: 'The Ordinary',
            category: 'skincare',
            subcategory: 'serum',
            price: 8.90,
            rating: 4.1,
            reviewCount: 1234,
            image: 'https://images.unsplash.com/photo-1556228578-dd62fbbad01e?w=400&q=80',
            description: 'High-strength vitamin C serum for brightening',
            ingredients: ['L-Ascorbic Acid', 'Hyaluronic Acid'],
            isFeatured: false,
            isBestseller: false,
            isNewArrival: true,
            dateAdded: '2024-03-20'
        },
        {
            id: 'make-007',
            name: 'Eyeshadow Palette - Coral Talk',
            brand: 'Etude House',
            category: 'makeup',
            subcategory: 'eyes',
            price: 18.00,
            originalPrice: 25.00,
            discount: 28,
            rating: 4.5,
            reviewCount: 892,
            image: 'https://images.unsplash.com/photo-1583180430999-4d4a3806fb96?w=400&q=80',
            description: '10-color eyeshadow palette with coral and pink tones',
            isFeatured: true,
            isBestseller: false,
            isNewArrival: false,
            dateAdded: '2024-02-15'
        }
    ];

    // Get all products
    static getAllProducts() {
        return [...this.products];
    }

    // Get products by category
    static getProductsByCategory(category) {
        if (category === 'bestsellers') {
            return this.products.filter(product => product.isBestseller);
        }
        if (category === 'new-arrivals') {
            return this.products.filter(product => product.isNewArrival);
        }
        return this.products.filter(product => product.category === category);
    }

    // Get featured products
    static getFeaturedProducts() {
        return this.products.filter(product => product.isFeatured);
    }

    // Get product by ID
    static getProductById(id) {
        return this.products.find(product => product.productId === id);
    }

    // Search products
    static searchProducts(query) {
        const searchTerm = query.toLowerCase();
        return this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            (product.ingredients && product.ingredients.some(ingredient =>
                ingredient.toLowerCase().includes(searchTerm)
            ))
        );
    }

    // Get products by brand
    static getProductsByBrand(brand) {
        return this.products.filter(product => product.brand === brand);
    }

    // Get products by price range
    static getProductsByPriceRange(min, max) {
        return this.products.filter(product =>
            product.price >= min && product.price <= max
        );
    }

    // Get products by rating
    static getProductsByRating(minRating) {
        return this.products.filter(product => product.rating >= minRating);
    }

    // Get all unique brands
    static getAllBrands() {
        return [...new Set(this.products.map(product => product.brand))].sort();
    }

    // Get all unique categories
    static getAllCategories() {
        return [...new Set(this.products.map(product => product.category))].sort();
    }

    // Sort products
    static sortProducts(products, sortBy) {
        const sortedProducts = [...products];

        switch (sortBy) {
            case 'price-low':
                return sortedProducts.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sortedProducts.sort((a, b) => b.price - a.price);
            case 'rating':
                return sortedProducts.sort((a, b) => b.rating - a.rating);
            case 'popularity':
                return sortedProducts.sort((a, b) => b.reviewCount - a.reviewCount);
            case 'newest':
                return sortedProducts.sort((a, b) =>
                    new Date(b.dateAdded) - new Date(a.dateAdded)
                );
            case 'name':
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return sortedProducts;
        }
    }

    // Filter products with multiple criteria
    static filterProducts(criteria) {
        let filtered = [...this.products];

        if (criteria.category && criteria.category !== 'all') {
            filtered = this.getProductsByCategory(criteria.category);
        }

        if (criteria.brand && criteria.brand.length > 0) {
            filtered = filtered.filter(product =>
                criteria.brand.includes(product.brand)
            );
        }

        if (criteria.priceMin !== undefined || criteria.priceMax !== undefined) {
            const min = criteria.priceMin || 0;
            const max = criteria.priceMax || Infinity;
            filtered = filtered.filter(product =>
                product.price >= min && product.price <= max
            );
        }

        if (criteria.rating) {
            filtered = filtered.filter(product => product.rating >= criteria.rating);
        }

        if (criteria.inStock !== undefined) {
            // Assuming all products are in stock for demo
            // filtered = filtered.filter(product => product.inStock === criteria.inStock);
        }

        if (criteria.onSale) {
            filtered = filtered.filter(product => product.originalPrice);
        }

        return filtered;
    }

    // Get product recommendations based on a product
    static getRecommendations(productId, limit = 4) {
        const product = this.getProductById(productId);
        if (!product) return [];

        // Get products from same category and brand, excluding the current product
        let recommendations = this.products.filter(p =>
            p.id !== productId &&
            (p.category === product.category || p.brand === product.brand)
        );

        // Sort by rating and return limited results
        recommendations = this.sortProducts(recommendations, 'rating');
        return recommendations.slice(0, limit);
    }

    // Add a new product (for admin functionality)
    static addProduct(productData) {
        const newProduct = {
            id: `${productData.category}-${String(Date.now()).slice(-3)}`,
            dateAdded: new Date().toISOString().split('T')[0],
            isFeatured: false,
            isBestseller: false,
            isNewArrival: true,
            rating: 0,
            reviewCount: 0,
            ...productData
        };

        this.products.push(newProduct);
        return newProduct;
    }

    // Update a product (for admin functionality)
    static updateProduct(productId, updates) {
        const index = this.products.findIndex(product => product.productId === productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            return this.products[index];
        }
        return null;
    }

    // Delete a product (for admin functionality)
    static deleteProduct(productId) {
        const index = this.products.findIndex(product => product.productId === productId);
        if (index !== -1) {
            const deletedProduct = this.products.splice(index, 1)[0];
            return deletedProduct;
        }
        return null;
    }

    // Get statistics
    static getStatistics() {
        return {
            totalProducts: this.products.length,
            totalCategories: this.getAllCategories().length,
            totalBrands: this.getAllBrands().length,
            averagePrice: (this.products.reduce((sum, p) => sum + p.price, 0) / this.products.length).toFixed(2),
            averageRating: (this.products.reduce((sum, p) => sum + p.rating, 0) / this.products.length).toFixed(1),
            bestsellerCount: this.products.filter(p => p.isBestseller).length,
            newArrivalCount: this.products.filter(p => p.isNewArrival).length,
            featuredCount: this.products.filter(p => p.isFeatured).length
        };
    }
}

// Export for use in other scripts
window.ProductManager = ProductManager;