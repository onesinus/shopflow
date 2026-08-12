import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { cartApi } from '../api/cart';
import { wishlistApi } from '../api/cart';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Price from '../components/Price';
import Spinner from '../components/Spinner';

export default function ProductPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    productsApi
      .getBySlug(slug)
      .then((p) => {
        setProduct(p);
        setVariantId(p.variants?.length ? p.variants[0].id : null);
        if (p.id) {
          return productsApi.getRelated(p.id).catch(() => []);
        }
        return [];
      })
      .then(setRelated)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await cartApi.addItem(product.id, quantity, variantId);
      toast('Added to cart', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast('Sign in to save items to your wishlist', 'info');
      return;
    }
    try {
      await wishlistApi.add(product.id);
      toast('Saved to wishlist', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!product) return <div className="container"><div className="alert alert-error">Product not found</div></div>;

  const selectedVariant = product.variants?.find((v) => v.id === variantId);

  return (
    <div className="container">
      <nav className="breadcrumbs">
        <Link to="/">Catalog</Link>
        <span>/</span>
        {product.category && <span>{product.category.name}</span>}
      </nav>

      <div className="product-detail">
        <div className="product-detail-media">
          <div className="product-card-image large">
            <span className="placeholder">SF</span>
          </div>
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          {product.sku && <p className="muted">SKU: {product.sku}</p>}
          <Price cents={product.priceCents} className="price-lg" />

          <p className="product-description">{product.description || 'No description available.'}</p>

          {product.variants?.length > 0 && (
            <div className="variant-group">
              <label htmlFor="variant">Option</label>
              <select
                id="variant"
                className="select"
                value={variantId ?? ''}
                onChange={(e) => setVariantId(Number(e.target.value))}
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — {v.priceCents !== null ? <Price cents={v.priceCents} /> : 'default price'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="qty-group">
            <label htmlFor="qty">Quantity</label>
            <input
              id="qty"
              type="number"
              min="1"
              max={product.stock ?? 99}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="product-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
            >
              {product.stock === 0 ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleToggleWishlist}>
              ♡ Wishlist
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2>You may also like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <Link key={p.id} to={`/products/${p.slug || p.id}`} className="product-card">
                <div className="product-card-image">
                  <span className="placeholder">SF</span>
                </div>
                <div className="product-card-body">
                  <h3 className="product-card-title">{p.name}</h3>
                  <Price cents={p.priceCents} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
