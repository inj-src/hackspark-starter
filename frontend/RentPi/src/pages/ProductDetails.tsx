import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-rentpi-green hover:text-green-700 font-medium mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Listings
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📦</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Details Placeholder</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          This is a placeholder page for product ID: <span className="font-mono font-semibold text-rentpi-green">{id}</span>.
          In a full application, this would fetch data from the central API based on this ID.
        </p>
        
        <button className="bg-rentpi-green hover:bg-green-600 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-sm">
          Rent this Item
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
