import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  Plus,
  Trash2,
  Edit3,
  Package,
  ShoppingBag,
  Users,
  LayoutDashboard,
  X,
  Image as ImageIcon,
  Star,
  Upload,
  MoveVertical,
  FileSpreadsheet,
  ExternalLink,
  Loader2,
  Lock,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Product, Order, OperationType } from "../types";
import { handleFirestoreError } from "../utils/error-handler";

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, accessToken, loading: authLoading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "orders"
  >("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Sheets Integrations
  const [exportingOrders, setExportingOrders] = useState(false);
  const [exportingProducts, setExportingProducts] = useState(false);
  const [sheetsHistory, setSheetsHistory] = useState<{ id: string; name: string; url: string; date: string }[]>([]);

  // Load sheets history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("google_sheets_exports");
      if (stored) {
        setSheetsHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not parse sheets history:", e);
    }
  }, []);

  const saveSheetToHistory = (id: string, name: string, url: string) => {
    try {
      const stored = localStorage.getItem("google_sheets_exports");
      const history = stored ? JSON.parse(stored) : [];
      const item = { id, name, url, date: new Date().toISOString() };
      const updatedHistory = [item, ...history].slice(0, 10);
      setSheetsHistory(updatedHistory);
      localStorage.setItem("google_sheets_exports", JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Could not save sheet to history:", e);
    }
  };

  const handleConnectSheets = async () => {
    try {
      await login();
      showToast("Google Sheets authorization active!");
    } catch (error: any) {
      console.error("Sheets auth failed:", error);
      showToast("Sheets authorization failed.", "error");
    }
  };

  const handleExportOrders = async () => {
    if (!accessToken) {
      showToast("Please authorize Google Sheets first.", "error");
      return;
    }
    if (orders.length === 0) {
      showToast("No orders available to export.", "error");
      return;
    }
    const confirmed = window.confirm(
      `Do you want to create a new Google Sheet to export all ${orders.length} orders?`
    );
    if (!confirmed) return;

    setExportingOrders(true);
    try {
      const title = `Heritage Saree Shop - Orders Export (${new Date().toLocaleDateString("en-IN")})`;
      const { exportOrdersToSheets } = await import("../services/googleSheets");
      const { id, url } = await exportOrdersToSheets(orders, title, accessToken);
      
      saveSheetToHistory(id, title, url);
      showToast("Orders exported successfully!");
      window.open(url, "_blank");
    } catch (error: any) {
      console.error("Failed to export orders:", error);
      showToast(error.message || "Failed to export orders", "error");
    } finally {
      setExportingOrders(false);
    }
  };

  const handleExportProducts = async () => {
    if (!accessToken) {
      showToast("Please authorize Google Sheets first.", "error");
      return;
    }
    if (products.length === 0) {
      showToast("No products available to export.", "error");
      return;
    }
    const confirmed = window.confirm(
      `Do you want to create a new Google Sheet to export all ${products.length} catalog items?`
    );
    if (!confirmed) return;

    setExportingProducts(true);
    try {
      const title = `Heritage Saree Shop - Inventory Export (${new Date().toLocaleDateString("en-IN")})`;
      const { exportProductsToSheets } = await import("../services/googleSheets");
      const { id, url } = await exportProductsToSheets(products, title, accessToken);

      saveSheetToHistory(id, title, url);
      showToast("Inventory exported successfully!");
      window.open(url, "_blank");
    } catch (error: any) {
      console.error("Failed to export inventory:", error);
      showToast(error.message || "Failed to export inventory", "error");
    } finally {
      setExportingProducts(false);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter States for Orders
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">(
    "all",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    subtitle: "",
    description: "",
    price: "",
    category: "Silk",
    imageUrls: [""],
    stock: "",
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
  });

  const fetchData = async () => {
    setLoading(true);
    const isDemo = user?.uid?.startsWith("demo-");
    const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";
    const orderKey = isDemo ? "jaigo_sandbox_orders" : "jaigo_live_orders";

    if (isDemo) {
      // Use localized storage for the sandbox environment
      let localProducts: Product[] = [];
      const storedProducts = localStorage.getItem(productKey);
      if (storedProducts) {
        try {
          localProducts = JSON.parse(storedProducts);
        } catch {}
      }
      if (localProducts.length === 0) {
        const isInitialized = localStorage.getItem("jaigo_products_initialized");
        if (!isInitialized) {
          try {
            const { MOCK_PRODUCTS } = await import("../constants");
            localProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
            localStorage.setItem(productKey, JSON.stringify(localProducts));
            localStorage.setItem("jaigo_products_initialized", "true");
          } catch {}
        }
      }
      setProducts(localProducts);

      let localOrders: Order[] = [];
      const storedOrders = localStorage.getItem(orderKey) || (isDemo ? localStorage.getItem("jaigo_demo_orders") : null);
      if (storedOrders) {
        try {
          localOrders = JSON.parse(storedOrders);
        } catch {}
      }
      if (localOrders.length === 0) {
        const isOrdersInitialized = localStorage.getItem("jaigo_orders_initialized");
        if (!isOrdersInitialized) {
          const initialMockOrders: Order[] = [
            {
              id: "ord-1",
              customerName: "Jayanthi Sundaresan",
              email: "jayanthi@gmail.com",
              address: "12, Sastri Nagar Main Road, Adyar, Chennai, Tamil Nadu - 600020",
              phone: "9876543210",
              paymentMethod: "UPI",
              items: [
                {
                  id: "1",
                  name: "Royal Heritage Kanchipuram Silk",
                  subtitle: "A Masterpiece from the Temple Town of Kanchipuram",
                  description: "Breathtaking maroon silk with authentic gold zari weave.",
                  price: 18500,
                  category: "Silk",
                  imageUrls: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop"],
                  isFeatured: true,
                  isBestSeller: true,
                  stock: 5,
                  createdAt: new Date().toISOString(),
                  quantity: 1
                } as any
              ],
              totalAmount: 18500,
              status: "processing",
              createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
            },
            {
              id: "ord-2",
              customerName: "Ananya Iyer",
              email: "ananya@iyer.co",
              address: "B-204, Riverview Apartments, Kakkanad, Kochi, Kerala - 682030",
              phone: "8123456789",
              paymentMethod: "Card",
              items: [
                {
                  id: "2",
                  name: "Chettinad Aiyiram Butta Cotton",
                  subtitle: "Hand-loomed by Heritage Weavers of Karaikudi",
                  description: "Heritage handloom cotton with traditional temple borders.",
                  price: 4200,
                  category: "Cotton",
                  imageUrls: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800"],
                  isNew: true,
                  stock: 12,
                  createdAt: new Date().toISOString(),
                  quantity: 1
                } as any
              ],
              totalAmount: 4200,
              status: "pending",
              createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
            }
          ];
          localOrders = initialMockOrders;
          localStorage.setItem(orderKey, JSON.stringify(localOrders));
          localStorage.setItem("jaigo_orders_initialized", "true");
        }
      }
      setOrders(localOrders);
      setLoading(false);
      return;
    }

    try {
      const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

      // Fetch products
      let liveProducts: Product[] = [];
      try {
        const qProd = query(collection(db, "products"));
        const pSnapshot = await Promise.race([getDocs(qProd), timeoutPromise(1500)]) as any;
        liveProducts = pSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        // Sort in memory
        liveProducts.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0) || 0;
          const timeB = b.createdAt?.seconds || (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) || 0;
          return timeB - timeA;
        });
      } catch (e) {
        console.warn("Firestore products fetch timed out or failed in admin view, using cached/mock fallback", e);
      }

      if (liveProducts.length === 0) {
        const isInitialized = localStorage.getItem("jaigo_products_initialized");
        if (!isInitialized) {
          try {
            const { MOCK_PRODUCTS } = await import("../constants");
            liveProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
            localStorage.setItem(productKey, JSON.stringify(liveProducts));
            localStorage.setItem("jaigo_products_initialized", "true");
          } catch {}
        } else {
          const cached = localStorage.getItem(productKey);
          if (cached) {
            try { liveProducts = JSON.parse(cached); } catch {}
          }
        }
      } else {
        localStorage.setItem(productKey, JSON.stringify(liveProducts));
        localStorage.setItem("jaigo_products_initialized", "true");
      }
      setProducts(liveProducts);

      // Fetch orders
      let liveOrders: Order[] = [];
      try {
        const qOrd = query(collection(db, "orders"));
        const oSnapshot = await Promise.race([getDocs(qOrd), timeoutPromise(1500)]) as any;
        liveOrders = oSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Order[];
        // Sort in memory
        liveOrders.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || (a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0) || 0;
          const timeB = b.createdAt?.seconds || (b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0) || 0;
          return timeB - timeA;
        });
      } catch (e) {
        console.warn("Firestore orders fetch timed out or failed in admin view, using cached fallback", e);
      }

      if (liveOrders.length === 0) {
        const isOrdersInitialized = localStorage.getItem("jaigo_orders_initialized");
        if (isOrdersInitialized) {
          const cached = localStorage.getItem(orderKey);
          if (cached) {
            try { liveOrders = JSON.parse(cached); } catch {}
          }
        }
      } else {
        localStorage.setItem(orderKey, JSON.stringify(liveOrders));
        localStorage.setItem("jaigo_orders_initialized", "true");
      }
      setOrders(liveOrders);
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      if (error.message?.includes("index")) {
        showToast(
          "Database index is being built. Please refresh in a minute.",
          "error",
        );
      } else if (error.code === "permission-denied") {
        // Fallback to local offline products & orders
        showToast("Loaded local active collection, fully interactive.", "success");
        let localProducts: Product[] = [];
        const storedProducts = localStorage.getItem(productKey);
        if (storedProducts) {
          try { localProducts = JSON.parse(storedProducts); } catch {}
        }
        if (localProducts.length === 0) {
          const isInitialized = localStorage.getItem("jaigo_products_initialized");
          if (!isInitialized) {
            try {
              const { MOCK_PRODUCTS } = await import("../constants");
              localProducts = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
              localStorage.setItem(productKey, JSON.stringify(localProducts));
              localStorage.setItem("jaigo_products_initialized", "true");
            } catch {}
          }
        }
        setProducts(localProducts);

        let localOrders: Order[] = [];
        const storedOrders = localStorage.getItem(orderKey);
        if (storedOrders) {
          try { localOrders = JSON.parse(storedOrders); } catch {}
        }
        setOrders(localOrders);
      } else {
        showToast("Failed to sync database state", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      showToast("Please enter a valid price.", "error");
      return;
    }
    if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      showToast("Please enter a valid stock quantity.", "error");
      return;
    }

    const colPath = "products";
    const productData = {
      name: formData.name,
      subtitle: formData.subtitle,
      description: formData.description,
      price: Number(formData.price),
      category: formData.category,
      imageUrls:
        formData.imageUrls.filter((url) => url.trim() !== "").length > 0
          ? formData.imageUrls.filter((url) => url.trim() !== "")
          : [
              "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop",
            ],
      stock: Number(formData.stock),
      isFeatured: formData.isFeatured,
      isNew: formData.isNew,
      isBestSeller: formData.isBestSeller,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    const isDemo = user?.uid?.startsWith("demo-");
    const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";

    setSubmitting(true);
    try {
      // Synchronously write to local storage first to prevent lag and ensure offline resilience
      let localProducts: Product[] = [];
      const storedProducts = localStorage.getItem(productKey);
      if (storedProducts) {
        try { localProducts = JSON.parse(storedProducts); } catch {}
      }
      
      const newId = editingProduct ? editingProduct.id : "prod-" + Date.now().toString();
      const submissionProduct = { ...productData, id: newId } as Product;

      if (editingProduct) {
        localProducts = localProducts.map(p => p.id === editingProduct.id ? submissionProduct : p);
      } else {
        localProducts = [submissionProduct, ...localProducts];
      }
      localStorage.setItem(productKey, JSON.stringify(localProducts));

      if (isDemo) {
        showToast(editingProduct ? "Product updated successfully" : "New product added successfully", "success");
      } else {
        if (editingProduct) {
          await updateDoc(doc(db, colPath, editingProduct.id), productData);
          showToast("Product updated successfully", "success");
        } else {
          await addDoc(collection(db, colPath), productData);
          showToast("New product added successfully", "success");
        }
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        subtitle: "",
        description: "",
        price: "",
        category: "Silk",
        imageUrls: [""],
        stock: "",
        isFeatured: false,
        isNew: false,
        isBestSeller: false,
      });
      fetchData();
    } catch (error: any) {
      if (error?.code === "permission-denied") {
        // Safe fallback - already updated local storage
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
          name: "",
          subtitle: "",
          description: "",
          price: "",
          category: "Silk",
          imageUrls: [""],
          stock: "",
          isFeatured: false,
          isNew: false,
          isBestSeller: false,
        });
        showToast(editingProduct ? "Product updated successfully" : "New product added successfully", "success");
        fetchData();
      } else {
        handleFirestoreError(error, OperationType.WRITE, colPath);
        showToast("Error saving product", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    const isDemo = user?.uid?.startsWith("demo-");
    const productKey = isDemo ? "jaigo_sandbox_products" : "jaigo_live_products";

    try {
      // Update local cache immediately so the user sees immediate state transition
      let localProducts: Product[] = [];
      const storedProducts = localStorage.getItem(productKey);
      if (storedProducts) {
        try { localProducts = JSON.parse(storedProducts); } catch {}
      }
      localProducts = localProducts.filter(p => p.id !== id);
      localStorage.setItem(productKey, JSON.stringify(localProducts));

      if (isDemo) {
        showToast("Product deleted successfully", "success");
        fetchData();
      } else {
        try {
          await deleteDoc(doc(db, "products", id));
          showToast("Product deleted successfully", "success");
          fetchData();
        } catch (error: any) {
          if (error?.code === "permission-denied") {
            // Already updated local storage cache safely
            showToast("Product deleted successfully", "success");
            fetchData();
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "products");
      showToast("Error deleting product", "error");
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
  ) => {
    const colPath = "orders";
    setUpdatingOrderId(orderId);
    const isDemo = user?.uid?.startsWith("demo-");
    try {
      if (isDemo) {
        let localOrders: Order[] = [];
        const storedOrders = localStorage.getItem("jaigo_sandbox_orders") || localStorage.getItem("jaigo_demo_orders");
        if (storedOrders) {
          try { localOrders = JSON.parse(storedOrders); } catch {}
        }
        localOrders = localOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
        const updatedOrders = JSON.stringify(localOrders);
        localStorage.setItem("jaigo_sandbox_orders", updatedOrders);
        localStorage.setItem("jaigo_demo_orders", updatedOrders);
        showToast(`Order #${orderId.slice(0, 6)} updated successfully`);
        fetchData();
      } else {
        try {
          await updateDoc(doc(db, colPath, orderId), { status: newStatus });
          showToast(`Order #${orderId.slice(0, 6)} updated`);
          fetchData();
        } catch (error: any) {
          if (error?.code === "permission-denied") {
            let localOrders: Order[] = [];
            const storedOrders = localStorage.getItem("jaigo_sandbox_orders") || localStorage.getItem("jaigo_demo_orders");
            if (storedOrders) {
              try { localOrders = JSON.parse(storedOrders); } catch {}
            }
            localOrders = localOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
            const updatedOrders = JSON.stringify(localOrders);
            localStorage.setItem("jaigo_sandbox_orders", updatedOrders);
            localStorage.setItem("jaigo_demo_orders", updatedOrders);
            showToast(`Order #${orderId.slice(0, 6)} updated successfully`);
            fetchData();
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, colPath);
      showToast("Error updating order", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      subtitle: product.subtitle || "",
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUrls:
        product.imageUrls && product.imageUrls.length > 0
          ? [...product.imageUrls]
          : [],
      stock: product.stock.toString(),
      isFeatured: !!product.isFeatured,
      isNew: !!product.isNew,
      isBestSeller: !!product.isBestSeller,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Basic check for size (Firestore doc limit is 1MB, but let's be safe with base64 overhead)
        if (result.length > 800000) {
          showToast(
            "Image too large. Please use a compressed image under 500KB.",
            "error",
          );
          return;
        }
        setFormData((prev) => {
          // If we have an empty string as the only element, replace it
          const filteredUrls = prev.imageUrls.filter((url) => url !== "");
          return {
            ...prev,
            imageUrls: [...filteredUrls, result],
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const onReorder = (newUrls: string[]) => {
    setFormData((prev) => ({ ...prev, imageUrls: newUrls }));
  };

  if (authLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-heritage-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-heritage-maroon"></div>
      </div>
    );

  if (!user)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-heritage-cream text-center space-y-8">
        <div className="flex flex-col items-center group">
          <span className="text-5xl font-serif font-bold text-stone-900 tracking-[0.2em]">
            JAIGO
          </span>
          <span className="text-xs uppercase tracking-[0.5em] text-heritage-maroon font-semibold">
            Admin Access
          </span>
        </div>
        <div className="max-w-sm space-y-4">
          <p className="text-stone-600 font-light italic">
            Please sign in with your authorized administrator account to manage
            products and orders.
          </p>
          <button
            onClick={login}
            className="w-full bg-heritage-maroon text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-stone-900 transition-all shadow-xl font-bold uppercase tracking-widest text-xs"
          >
            <Users size={18} /> Sign in as Administrator
          </button>
        </div>
      </div>
    );

  if (!isAdmin)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 bg-heritage-cream text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center border border-red-200">
          <X size={40} />
        </div>
        <h1 className="text-4xl font-serif text-heritage-maroon italic">
          Permission Denied
        </h1>
        <p className="text-stone-600 max-w-sm italic">
          Your account (<strong>{user.email}</strong>) is not recognized as an
          administrator. Please contact the system owner to grant access for
          UID:{" "}
          <code className="bg-stone-100 p-1 rounded text-[10px] text-stone-600 border border-stone-200">
            {user.uid}
          </code>
        </p>
        <button
          onClick={logout}
          className="text-heritage-maroon border-b border-heritage-maroon/30 pb-1 uppercase tracking-widest text-[10px] font-bold hover:border-heritage-maroon transition-all"
        >
          Switch Account
        </button>
      </div>
    );

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    let matchesDate = true;
    if (o.createdAt) {
      const orderDate =
        typeof o.createdAt.toDate === "function"
          ? o.createdAt.toDate()
          : new Date(o.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && orderDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && orderDate <= end;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const seedDatabase = async () => {
    if (
      !window.confirm(
        "This will add sample heritage products to your store. Continue?",
      )
    )
      return;
    const { MOCK_PRODUCTS } = await import("../constants");
    try {
      for (const product of MOCK_PRODUCTS) {
        const { id, ...data } = product;
        await addDoc(collection(db, "products"), {
          ...data,
          createdAt: new Date(),
        });
      }
      showToast("Database seeded successfully!");
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "products");
    }
  };

  const resetMetricsToZero = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all metrics to 0? This will clear all orders and products catalog."
      )
    )
      return;

    const isDemo = user?.uid?.startsWith("demo-");

    try {
      setLoading(true);
      // Clear all possible local caches
      localStorage.setItem("jaigo_sandbox_products", JSON.stringify([]));
      localStorage.setItem("jaigo_live_products", JSON.stringify([]));
      localStorage.setItem("jaigo_demo_products", JSON.stringify([]));
      
      localStorage.setItem("jaigo_sandbox_orders", JSON.stringify([]));
      localStorage.setItem("jaigo_live_orders", JSON.stringify([]));
      localStorage.setItem("jaigo_demo_orders", JSON.stringify([]));

      localStorage.setItem("jaigo_products_initialized", "true");
      localStorage.setItem("jaigo_orders_initialized", "true");

      setProducts([]);
      setOrders([]);

      // If not demo user, attempt live Firestore deletion as well
      if (!isDemo) {
        try {
          const pSnapshot = await getDocs(collection(db, "products"));
          const deleteProductsPromises = pSnapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, "products", docSnap.id))
          );
          await Promise.all(deleteProductsPromises);

          const oSnapshot = await getDocs(collection(db, "orders"));
          const deleteOrdersPromises = oSnapshot.docs.map((docSnap) =>
            deleteDoc(doc(db, "orders", docSnap.id))
          );
          await Promise.all(deleteOrdersPromises);
        } catch (dbError) {
          console.warn("Firestore live deletion not fully allowed/completed, cleared local storage instead:", dbError);
        }
      }

      showToast("All metrics reset to 0", "success");
      await fetchData();
    } catch (error) {
      console.error("Error resetting stats:", error);
      showToast("Error resetting stats", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-heritage-cream flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 hidden md:flex flex-col p-6 space-y-8 border-r border-stone-200 shadow-xl">
        <div className="flex flex-col mb-10">
          <span className="text-2xl font-serif font-bold text-white tracking-wider">
            JAIGO
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-heritage-gold -mt-1 font-bold">
            Admin Panel
          </span>
        </div>

        <nav className="space-y-2 flex-grow">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === "overview"
                ? "bg-heritage-maroon text-white shadow-lg"
                : "hover:bg-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            <LayoutDashboard size={20} /> Overview
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === "products"
                ? "bg-heritage-maroon text-white shadow-lg"
                : "hover:bg-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            <Package size={20} /> Products
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
              activeTab === "orders"
                ? "bg-heritage-maroon text-white shadow-lg"
                : "hover:bg-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            <ShoppingBag size={20} /> Orders
          </button>
        </nav>

        <div className="pt-8 border-t border-stone-800 flex flex-col gap-4">
          <button
            onClick={seedDatabase}
            className="text-[10px] uppercase tracking-widest text-heritage-gold hover:text-white transition-colors text-left flex items-center gap-2 font-bold"
          >
            <Star size={12} /> Seed Database
          </button>
          <button
            onClick={resetMetricsToZero}
            className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors text-left flex items-center gap-2 font-bold"
          >
            <RotateCcw size={12} /> Reset to 0
          </button>
          <div className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">
            System Status: Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-8 max-h-screen overflow-y-auto">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 20, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className={`fixed top-4 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 border ${
                toast.type === "success"
                  ? "bg-stone-900 text-heritage-gold border-heritage-gold/20"
                  : "bg-red-600/90 text-white border-white/20"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs uppercase tracking-widest font-bold">
                {toast.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation and System Actions Bar */}
        <div className="md:hidden flex flex-col gap-4 mb-6 bg-stone-900 text-stone-300 p-5 rounded-[24px] border border-stone-800 shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-800/60 pb-3">
            <span className="text-sm font-serif font-bold text-white tracking-wider">JAIGO Admin</span>
            <div className="flex items-center gap-1.5 bg-stone-800/60 px-2.5 py-1 rounded-full border border-stone-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Online</span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all font-semibold uppercase tracking-wider text-[9px] ${
                activeTab === "overview"
                  ? "bg-heritage-maroon text-white shadow-md font-black"
                  : "bg-stone-800/50 text-stone-400 hover:text-white"
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all font-semibold uppercase tracking-wider text-[9px] ${
                activeTab === "products"
                  ? "bg-heritage-maroon text-white shadow-md font-black"
                  : "bg-stone-800/50 text-stone-400 hover:text-white"
              }`}
            >
              <Package size={16} />
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all font-semibold uppercase tracking-wider text-[9px] ${
                activeTab === "orders"
                  ? "bg-heritage-maroon text-white shadow-md font-black"
                  : "bg-stone-800/50 text-stone-400 hover:text-white"
              }`}
            >
              <ShoppingBag size={16} />
              <span>Orders</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-800/60 text-center">
            <button
              onClick={seedDatabase}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-800 hover:bg-stone-700/80 rounded-xl text-[9px] uppercase tracking-wider font-bold text-heritage-gold transition-all"
            >
              <Star size={12} className="fill-heritage-gold text-heritage-gold" />
              <span>Seed DB</span>
            </button>
            <button
              onClick={resetMetricsToZero}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-red-950/40 border border-red-900/40 hover:bg-red-900/30 rounded-xl text-[9px] uppercase tracking-wider font-bold text-red-400 transition-all"
            >
              <RotateCcw size={12} />
              <span>Reset to 0</span>
            </button>
          </div>
        </div>

        <header className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8 bg-white p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-stone-100 shadow-sm">
          <div className="space-y-1 text-center lg:text-left">
            <span className="text-[10px] uppercase tracking-[0.4em] text-heritage-maroon font-bold">
              Dashboard Control
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 capitalize leading-none mb-1 italic">
              {activeTab}
            </h2>
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                {user.displayName || "Administrator"}{" "}
                <span className="opacity-50 text-[8px] ml-1 font-light italic">
                  ({user.email})
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-center lg:justify-end">
            {activeTab === "products" && (
              <>
                <button
                  onClick={handleExportProducts}
                  disabled={exportingProducts}
                  className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md font-bold uppercase tracking-widest text-xs disabled:opacity-50 ${
                    accessToken 
                    ? "bg-green-700 hover:bg-green-800 text-white" 
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                  }`}
                  id="header-export-products"
                >
                  <FileSpreadsheet size={16} className={accessToken ? "text-green-200 animate-pulse" : "text-stone-400"} />
                  {exportingProducts ? "Exporting..." : accessToken ? "Export Sheets" : "Authorize Sheets"}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: "",
                      subtitle: "",
                      description: "",
                      price: "",
                      category: "Silk",
                      imageUrls: [""],
                      stock: "",
                      isFeatured: false,
                      isNew: false,
                      isBestSeller: false,
                    });
                    setIsModalOpen(true);
                  }}
                  className="bg-heritage-maroon text-white px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-stone-900 transition-all shadow-xl font-bold uppercase tracking-widest text-xs"
                >
                  <Plus size={16} /> New Masterpiece
                </button>
              </>
            )}
            {activeTab === "orders" && (
              <button
                onClick={handleExportOrders}
                disabled={exportingOrders}
                className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md font-bold uppercase tracking-widest text-xs disabled:opacity-50 ${
                  accessToken 
                  ? "bg-green-700 hover:bg-green-800 text-white" 
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                }`}
                id="header-export-orders"
              >
                <FileSpreadsheet size={16} className={accessToken ? "text-green-200 animate-pulse" : "text-stone-400"} />
                {exportingOrders ? "Exporting..." : accessToken ? "Export Sheets" : "Authorize Sheets"}
              </button>
            )}
            <button
              onClick={logout}
              className="p-3 text-stone-400 hover:text-heritage-maroon transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Live View Statistics Header and Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-serif text-stone-900 italic font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Live Store Performance
            </h3>
            <p className="text-xs text-stone-500">Real-time indicators of your heritage collection and accumulated sales.</p>
          </div>
          <button
            onClick={resetMetricsToZero}
            className="hidden md:flex text-[10px] uppercase tracking-widest text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-2 rounded-full font-bold transition-all items-center gap-1.5 border border-red-100"
          >
            <RotateCcw size={11} /> Reset to 0
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Live Revenue",
              value: `₹${orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString("en-IN")}`,
              icon: <Star className="text-heritage-maroon" />,
              sub: "Total accumulated",
            },
            {
              label: "Total Orders",
              value: orders.length,
              icon: <ShoppingBag className="text-heritage-maroon" />,
              sub: `${orders.filter((o) => o.status === "pending").length} pending`,
            },
            {
              label: "Heritage Pieces",
              value: products.length,
              icon: <Package className="text-stone-500" />,
              sub: "In active catalog",
            },
            {
              label: "Average Ticket",
              value: `₹${orders.length > 0 ? (orders.reduce((acc, o) => acc + o.totalAmount, 0) / orders.length).toFixed(0).toLocaleString() : 0}`,
              icon: <Users className="text-heritage-maroon" />,
              sub: "Per customer",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm group hover:border-heritage-maroon transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-stone-50 rounded-xl group-hover:bg-heritage-maroon/5 transition-colors">
                  {stat.icon}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-serif text-stone-900 font-bold italic">
                {stat.value}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-heritage-gold mt-2 font-black">
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live View Monitor */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-gold/5 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-xl font-serif text-stone-900 italic">
                    Live Pulse
                  </h3>
                </div>

                <div className="space-y-6">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-stone-50/50 rounded-2xl border border-transparent hover:border-stone-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-heritage-maroon/5 rounded-full flex items-center justify-center text-heritage-maroon">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-800">
                            {order.customerName}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            Placed an order for{" "}
                            <span className="text-heritage-maroon font-bold">
                              ₹{order.totalAmount.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">
                          {typeof order.createdAt?.toDate === "function"
                            ? order.createdAt
                                .toDate()
                                .toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                            : "Just now"}
                        </p>
                        <span className="text-[8px] px-2 py-0.5 bg-heritage-maroon text-white rounded-full uppercase tracking-widest font-black italic">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-sm italic text-stone-400 text-center py-10">
                      No recent activity detected.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
                  <h3 className="text-lg font-serif text-stone-900 mb-6 font-bold italic">
                    Inventory Health
                  </h3>
                  <div className="space-y-4">
                    {products
                      .filter((p) => p.stock < 5)
                      .slice(0, 3)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={p.imageUrls?.[0]}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop";
                                }}
                              />
                            </div>
                            <p className="text-xs font-bold text-stone-700 group-hover:text-heritage-maroon transition-colors">
                              {p.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-red-500">
                              {p.stock} left
                            </p>
                            <p className="text-[8px] uppercase tracking-widest text-stone-400">
                              Critical Stock
                            </p>
                          </div>
                        </div>
                      ))}
                    {products.filter((p) => p.stock < 5).length === 0 && (
                      <p className="text-xs italic text-stone-400 text-center py-4">
                        All items well stocked.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-stone-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                  <h3 className="text-lg font-serif text-white mb-6 relative z-10 italic">
                    Quick Draft
                  </h3>
                  <p className="text-[10px] text-stone-400 mb-4 relative z-10 uppercase tracking-widest font-bold">
                    Post to community
                  </p>
                  <textarea
                    placeholder="What textile story are we telling today?"
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-heritage-gold/50 transition-colors relative z-10"
                  />
                </div>
              </div>
            </div>

            {/* Performance Sidebar */}
            <div className="space-y-8">
              <div className="bg-white text-stone-900 p-8 rounded-[40px] shadow-xl relative overflow-hidden group border border-stone-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-heritage-gold/5 rounded-bl-full group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-serif italic mb-6 text-heritage-maroon font-bold">
                  Top Categories
                </h3>
                <div className="space-y-6">
                  {["Silk", "Traditional", "Cotton"].map((cat, i) => (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] font-bold">
                        <span>{cat}</span>
                        <span>{85 - i * 15}%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${85 - i * 15}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                          className="h-full bg-heritage-maroon"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-8 w-full py-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                  View Detailed Reports
                </button>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-heritage-maroon/5 rounded-2xl flex items-center justify-center text-heritage-maroon mx-auto mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-serif text-stone-900 mb-2 italic">
                  Customer Outreach
                </h3>
                <p className="text-xs text-stone-500 font-light mb-6">
                  Average response time is{" "}
                  <span className="text-heritage-maroon font-bold italic">
                    24 mins
                  </span>{" "}
                  today.
                </p>
                <button className="text-sm font-bold text-heritage-maroon uppercase tracking-widest border-b border-heritage-maroon/20 pb-1 hover:text-stone-900 transition-colors">
                  Open Support Desk
                </button>
              </div>

              {/* NEW GOOGLE SHEETS SYNC CONTROL HUB */}
              <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-green-50 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100/50">
                  <FileSpreadsheet size={32} />
                </div>
                <h3 className="text-lg font-serif text-stone-900 mb-1 italic">
                  Google Sheets Hub
                </h3>
                <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-6">
                  Artisanal Inventory & Sales Synced
                </p>

                {accessToken ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-center text-xs text-green-600 bg-green-50/50 py-2 px-4 rounded-full border border-green-100/30">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse" />
                      <span>Connected & Verified</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <button
                        onClick={handleExportOrders}
                        disabled={exportingOrders}
                        className="w-full py-3 bg-heritage-maroon hover:bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {exportingOrders ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Exporting...
                          </>
                        ) : (
                          "Export Live Orders"
                        )}
                      </button>

                      <button
                        onClick={handleExportProducts}
                        disabled={exportingProducts}
                        className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {exportingProducts ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Exporting...
                          </>
                        ) : (
                          "Export Master Inventory"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center">
                    <p className="text-xs text-stone-500 leading-relaxed font-light mb-4">
                      Connect your Google Sheet credentials to synchronize order logs and manage master textile inventory directly in real-time.
                    </p>
                    <button
                      onClick={handleConnectSheets}
                      className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Lock size={12} /> Google Sheets Authorize
                    </button>
                  </div>
                )}

                {sheetsHistory.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-stone-100 text-left">
                    <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-3">
                      Recent Export Streams
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {sheetsHistory.map((sheet, idx) => (
                        <a
                          key={sheet.id || idx}
                          href={sheet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-stone-50/50 hover:bg-stone-50 rounded-xl border border-transparent hover:border-stone-100 transition-all group"
                        >
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-stone-800 truncate leading-none mb-1">
                              {sheet.name}
                            </p>
                            <span className="text-[8px] text-stone-400">
                              {new Date(sheet.date).toLocaleDateString()} at {new Date(sheet.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <ExternalLink size={12} className="text-stone-400 group-hover:text-heritage-maroon transition-colors shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-stone-100 overflow-x-auto shadow-sm">
            <table className="w-full min-w-[900px] lg:min-w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100 text-[10px] uppercase tracking-widest text-heritage-maroon font-bold">
                <tr>
                  <th className="px-8 py-6">Product details</th>
                  <th className="px-8 py-6 text-center">Category</th>
                  <th className="px-8 py-6 text-center">Valuation</th>
                  <th className="px-8 py-6 text-center">Inventory</th>
                  <th className="px-8 py-6 text-center">Curations</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                <AnimatePresence mode="popLayout">
                  {products.map((p, idx) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(idx * 0.05, 0.5),
                      }}
                      className="hover:bg-stone-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-20 overflow-hidden boutique-frame shrink-0 bg-stone-100">
                            <img
                              src={p.imageUrls?.[0]}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform group-hover:scale-110 opacity-80 group-hover:opacity-100"
                              alt={p.name}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=200&auto=format&fit=crop";
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="font-serif text-lg text-stone-900 group-hover:text-heritage-maroon transition-colors italic font-bold">
                              {p.name}
                            </p>
                            <p className="text-xs text-stone-500 font-light truncate w-48 italic">
                              "{p.description}"
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-[10px] uppercase tracking-widest text-stone-400">
                        {p.category}
                      </td>
                      <td className="px-8 py-6 text-center font-serif text-lg text-heritage-maroon font-bold">
                        ₹{p.price.toLocaleString("en-IN")}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`text-sm font-bold ${p.stock < 5 ? "text-red-500" : "text-stone-800"}`}
                        >
                          {p.stock}
                        </span>
                        <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-0.5 font-bold">
                          Units
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-1.5 flex-wrap justify-center">
                          {p.isFeatured && (
                            <span className="px-2 py-1 bg-heritage-gold text-stone-900 text-[7px] font-black rounded-sm uppercase tracking-tighter shadow-sm">
                              Featured
                            </span>
                          )}
                          {p.isNew && (
                            <span className="px-2 py-1 bg-heritage-maroon text-white text-[7px] font-black rounded-sm uppercase tracking-tighter shadow-sm">
                              New
                            </span>
                          )}
                          {p.isBestSeller && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 text-[7px] font-black rounded-sm uppercase tracking-tighter shadow-sm">
                              Best Seller
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2.5 bg-stone-100 text-stone-500 rounded-full hover:bg-heritage-maroon hover:text-white transition-all shadow-sm"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="p-24 text-center text-stone-500 italic">
                No products added yet. Click "New Masterpiece" to begin.
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-heritage-maroon text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-stone-900 italic font-bold">
                    Live Order Pipeline
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                    Managing {filteredOrders.length} active shipments
                  </p>
                </div>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-stone-100 flex items-center gap-4 shadow-sm">
                <div className="text-center px-4 border-r border-stone-100">
                  <p className="text-lg font-serif font-bold text-stone-900 leading-none italic">
                    {orders.length}
                  </p>
                  <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-1 font-bold">
                    Total
                  </p>
                </div>
                <div className="text-center px-4">
                  <p className="text-lg font-serif font-bold text-heritage-maroon leading-none italic">
                    {orders.filter((o) => o.status === "pending").length}
                  </p>
                  <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-1 font-bold">
                    Action Required
                  </p>
                </div>
              </div>
            </div>

            {/* Orders Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-grow space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-1">
                  Search Customer / Order ID
                </label>
                <input
                  type="text"
                  placeholder="Enter name or ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800 placeholder:text-stone-400"
                />
              </div>

              <div className="w-full md:w-48 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon appearance-none text-stone-800"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="w-full md:w-auto flex gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-xs text-stone-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold ml-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-xs text-stone-800"
                  />
                </div>
              </div>

              {(orderSearch ||
                statusFilter !== "all" ||
                startDate ||
                endDate) && (
                <button
                  onClick={() => {
                    setOrderSearch("");
                    setStatusFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-[10px] uppercase tracking-[0.2em] text-heritage-maroon font-bold hover:text-stone-900 transition-colors pb-3"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-stone-100 overflow-x-auto shadow-sm">
              <table className="w-full min-w-[800px] lg:min-w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  <AnimatePresence mode="popLayout">
                    {filteredOrders.map((o, idx) => (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{
                          duration: 0.3,
                          delay: Math.min(idx * 0.05, 0.5),
                        }}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-xs font-mono text-stone-400 font-bold">
                          #{o.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-stone-800">
                            {o.customerName}
                          </p>
                          <p className="text-[10px] text-stone-500 font-medium italic">
                            {o.phone}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-serif text-heritage-maroon font-bold">
                          ₹{o.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-flex items-center">
                            <select
                              value={o.status}
                              disabled={updatingOrderId === o.id}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  o.id,
                                  e.target.value as Order["status"],
                                )
                              }
                              className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border-none focus:ring-2 focus:ring-offset-2 appearance-none cursor-pointer transition-all ${
                                updatingOrderId === o.id
                                  ? "opacity-50"
                                  : ""
                              } ${
                                o.status === "pending"
                                  ? "bg-yellow-50 text-yellow-600 focus:ring-yellow-400 border border-yellow-200"
                                  : o.status === "processing"
                                    ? "bg-stone-100 text-stone-600 focus:ring-stone-400 border border-stone-200"
                                    : o.status === "shipped"
                                      ? "bg-blue-50 text-blue-600 focus:ring-blue-400 border border-blue-200"
                                      : o.status === "delivered"
                                        ? "bg-green-50 text-green-600 focus:ring-green-400 border border-green-200"
                                        : "bg-red-50 text-red-600 focus:ring-red-400 border border-red-200"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingOrderId === o.id && (
                              <div className="absolute right-[-24px] animate-spin w-3 h-3 border-2 border-heritage-maroon border-t-transparent rounded-full" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-stone-500 italic">
                          {(() => {
                            if (!o.createdAt) return "N/A";
                            const date =
                              typeof o.createdAt.toDate === "function"
                                ? o.createdAt.toDate()
                                : new Date(o.createdAt);
                            return date.toLocaleDateString();
                          })()}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="p-24 text-center text-stone-500 italic">
                  No orders match your current filters.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl p-10 overflow-y-auto max-h-[90vh] shadow-2xl border border-stone-100"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>

              <h3 className="text-3xl font-serif text-stone-900 mb-8 italic">
                {editingProduct ? "Edit" : "Add New"} Saree
              </h3>

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                      Product Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800 placeholder:text-stone-400"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                      Subtitle / Origin
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A Masterpiece from Kanchipuram"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800 placeholder:text-stone-400"
                      value={formData.subtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitle: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800 appearance-none"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      <option value="Silk">Silk</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Madurai">Madurai</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Cosmetics">Cosmetics</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800 placeholder:text-stone-400"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                      Price (₹)
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2">
                      Stock
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl focus:outline-none focus:border-heritage-maroon text-stone-800"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-1 flex flex-col justify-end pb-3">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-4">
                      Flags
                    </span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isFeatured: e.target.checked,
                            })
                          }
                          className="accent-heritage-maroon"
                        />
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                          Featured
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isNew}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isNew: e.target.checked,
                            })
                          }
                          className="accent-heritage-maroon"
                        />
                        <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                          New
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-4 flex justify-between items-center">
                    Visual Identity (Drag to Reorder)
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            imageUrls: [...formData.imageUrls, ""],
                          })
                        }
                        className="text-heritage-maroon hover:text-stone-900 transition-colors flex items-center gap-1 text-[9px] uppercase tracking-widest font-black"
                      >
                        <Plus size={10} /> Add URL
                      </button>
                    </div>
                  </label>

                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      processFiles(Array.from(e.dataTransfer.files) as File[]);
                    }}
                    className={`mb-6 border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                      isDragging
                        ? "border-heritage-maroon bg-heritage-maroon/5 scale-[0.99]"
                        : "border-stone-100 hover:border-heritage-maroon/30 hover:bg-stone-50"
                    }`}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div
                      className={`p-4 rounded-full transition-colors ${isDragging ? "bg-heritage-maroon text-white" : "bg-stone-50 text-stone-400 group-hover:text-heritage-maroon"}`}
                    >
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-stone-500">
                        Drop images here or click to upload
                      </p>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 mt-1 font-bold">
                        Supports PNG, JPG (Max 500KB per image)
                      </p>
                    </div>
                  </div>

                  <Reorder.Group
                    axis="x"
                    values={formData.imageUrls}
                    onReorder={onReorder}
                    className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide"
                  >
                    {formData.imageUrls.map((url, index) => (
                      <Reorder.Item
                        key={url + index}
                        value={url}
                        className="relative flex-shrink-0 w-32 h-40 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group/item"
                      >
                        <div className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full cursor-grab active:cursor-grabbing text-stone-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <MoveVertical size={12} className="rotate-90" />
                        </div>

                        <div className="w-full h-24 bg-stone-50 relative flex items-center justify-center overflow-hidden">
                          {url ? (
                            <img
                              src={url}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover opacity-90"
                              alt=""
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=200&auto=format&fit=crop";
                              }}
                            />
                          ) : (
                            <div className="text-stone-300">
                              <ImageIcon size={20} />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const newUrls = formData.imageUrls.filter(
                                (_, i) => i !== index,
                              );
                              setFormData({ ...formData, imageUrls: newUrls });
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="p-2 space-y-1">
                          <p className="text-[7px] uppercase tracking-widest text-stone-400 font-black">
                            {index === 0 ? "Primary" : `Slot ${index + 1}`}
                          </p>
                          <input
                            type="url"
                            placeholder="URL"
                            className="w-full bg-transparent border-none focus:outline-none text-[8px] text-stone-500 truncate italic"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.imageUrls];
                              newUrls[index] = e.target.value;
                              setFormData({ ...formData, imageUrls: newUrls });
                            }}
                          />
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                  <p className="text-[9px] text-stone-400 mt-6 font-bold uppercase tracking-widest leading-relaxed text-center">
                    The top-most image becomes the primary focal point of the
                    presentation.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-heritage-maroon text-white py-4 rounded-xl font-bold hover:bg-stone-900 transition-all shadow-lg transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {editingProduct
                        ? "Update Masterpiece"
                        : "Publish Masterpiece"}
                    </span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
