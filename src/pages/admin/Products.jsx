// src/pages/admin/Products.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  Package, 
  Tag, 
  Star, 
  Edit, 
  Trash2, 
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { Input } from '../../components/ui/input';

export default function ProductsPage() {
  // Placeholder product data
  const products = [
    {
      id: 'prod_001',
      name: 'Organic Hemp Oil Tincture',
      price: 49.99,
      status: 'in_stock',
      category: 'Tinctures',
      sku: 'HEMP-OIL-1000',
      rating: 4.8,
      inventory: 124,
      image: '/placeholder-product.jpg'
    },
    {
      id: 'prod_002',
      name: 'CBD Relief Balm',
      price: 34.95,
      status: 'in_stock',
      category: 'Topicals',
      sku: 'CBD-BALM-200',
      rating: 4.6,
      inventory: 89,
      image: '/placeholder-product.jpg'
    },
    {
      id: 'prod_003',
      name: 'Full Spectrum Gummies',
      price: 29.99,
      status: 'low_stock',
      category: 'Edibles',
      sku: 'FS-GUMMY-30',
      rating: 4.9,
      inventory: 12,
      image: '/placeholder-product.jpg'
    },
    {
      id: 'prod_004',
      name: 'Pet CBD Drops',
      price: 39.95,
      status: 'in_stock',
      category: 'Pet Products',
      sku: 'PET-CBD-500',
      rating: 4.7,
      inventory: 56,
      image: '/placeholder-product.jpg'
    },
    {
      id: 'prod_005',
      name: 'Sleep Support Capsules',
      price: 44.99,
      status: 'out_of_stock',
      category: 'Capsules',
      sku: 'SLEEP-CAP-60',
      rating: 4.5,
      inventory: 0,
      image: '/placeholder-product.jpg'
    },
    {
      id: 'prod_006',
      name: 'Calming Tea Blend',
      price: 19.95,
      status: 'in_stock',
      category: 'Beverages',
      sku: 'CALM-TEA-20',
      rating: 4.3,
      inventory: 78,
      image: '/placeholder-product.jpg'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800 border-green-200">In Stock</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, inventory, and pricing
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Product Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {getStatusBadge(product.status)}
              </div>
              <CardDescription className="flex items-center">
                <Tag className="h-3.5 w-3.5 mr-1" />
                {product.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm ml-1">{product.rating}</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>SKU: {product.sku}</p>
                <p>Inventory: {product.inventory} units</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Placeholder Note */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Products Module</CardTitle>
          <CardDescription>
            This is a placeholder for the products management module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder implementation of the products management page. The final module will include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Complete product CRUD operations</li>
            <li>Advanced filtering and search</li>
            <li>Inventory management</li>
            <li>Bulk operations</li>
            <li>Product variants and attributes</li>
            <li>Category management</li>
            <li>Product images and gallery</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
