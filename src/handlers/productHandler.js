const Boom = require('@hapi/boom');
const Product = require('../models/Product');
const { successResponse, paginatedResponse } = require('../utils/response');

class ProductHandler {
  /**
   * GET /api/products - Get all products with pagination and filters
   */
  async getAllProducts(request, h) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        minPrice,
        maxPrice,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = request.query;

      // Build query
      const query = { isActive: true };

      if (category) {
        query.category = category;
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Execute query
      const [products, total] = await Promise.all([
        Product.find(query)
          .sort(sort)
          .limit(Number(limit))
          .skip(skip)
          .lean(),
        Product.countDocuments(query),
      ]);

      return h.response(
        paginatedResponse('Products retrieved successfully', products, {
          page: Number(page),
          limit: Number(limit),
          total,
        })
      ).code(200);
    } catch (error) {
      console.error('Get products error:', error);
      throw Boom.badImplementation('Failed to retrieve products');
    }
  }

  /**
   * GET /api/products/{id} - Get product by ID
   */
  async getProductById(request, h) {
    try {
      const { id } = request.params;
      
      const product = await Product.findById(id);

      if (!product) {
        throw Boom.notFound('Product not found');
      }

      return h.response(
        successResponse('Product retrieved successfully', product)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to retrieve product');
    }
  }

  /**
   * POST /api/products - Create new product (Admin only)
   */
  async createProduct(request, h) {
    try {
      const product = new Product(request.payload);
      await product.save();

      return h.response(
        successResponse('Product created successfully', product)
      ).code(201);
    } catch (error) {
      console.error('Create product error:', error);
      throw Boom.badImplementation('Failed to create product');
    }
  }

  /**
   * PUT /api/products/{id} - Update product (Admin only)
   */
  async updateProduct(request, h) {
    try {
      const { id } = request.params;
      
      const product = await Product.findByIdAndUpdate(
        id,
        request.payload,
        { new: true, runValidators: true }
      );

      if (!product) {
        throw Boom.notFound('Product not found');
      }

      return h.response(
        successResponse('Product updated successfully', product)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to update product');
    }
  }

  /**
   * DELETE /api/products/{id} - Soft delete product (Admin only)
   */
  async deleteProduct(request, h) {
    try {
      const { id } = request.params;
      
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        throw Boom.notFound('Product not found');
      }

      return h.response(
        successResponse('Product deleted successfully')
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to delete product');
    }
  }

  /**
   * GET /api/products/categories - Get all categories
   */
  async getCategories(request, h) {
    try {
      const categories = await Product.distinct('category', { isActive: true });

      return h.response(
        successResponse('Categories retrieved successfully', categories)
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to retrieve categories');
    }
  }

  /**
   * GET /api/products/popular - Get popular products
   */
  async getPopularProducts(request, h) {
    try {
      const { limit = 10 } = request.query;

      const products = await Product.find({ isActive: true })
        .sort({ purchaseCount: -1, 'rating.average': -1 })
        .limit(Number(limit))
        .lean();

      return h.response(
        successResponse('Popular products retrieved successfully', products)
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to retrieve popular products');
    }
  }
}

module.exports = new ProductHandler();