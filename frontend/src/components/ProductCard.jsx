import { useState } from 'react';
import { Link } from 'react-router-dom';
import Price from './Price';

export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = !imageFailed && product.imageUrl ? product.imageUrl : null;

  return (
    <Link to={`/products/${product.slug || product.id}`} className="product-card">
      <div className="product-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} onError={() => setImageFailed(true)} loading="lazy" />
        ) : (
          <span className="placeholder">SF</span>
        )}
      </div>
      <div className="product-card-body">
        <h3 className="product-card-title">{product.name}</h3>
        {product.categoryName && <p className="product-card-category">{product.categoryName}</p>}
        <div className="product-card-footer">
          <Price cents={product.priceCents} />
          {product.stock !== undefined && (
            <span className={`stock-chip ${product.stock > 0 ? 'in' : 'out'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
