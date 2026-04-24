CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* Función para actualizar timestamps automáticamente */
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* Productos */
CREATE TABLE IF NOT EXISTS productos (
    id  TEXT PRIMARY KEY,
    nombre  TEXT NOT NULL,
    precio_numerico NUMERIC(10, 2) NOT NULL,
    precio_str  TEXT NOT NULL,
    moneda  CHAR(3) NOT NULL DEFAULT 'EUR',
    color  TEXT,
    imagenes  JSONB NOT NULL DEFAULT '[]',
    tallas  JSONB NOT NULL DEFAULT '[]',
    stock  JSONB NOT NULL DEFAULT '{}',
    detalles  JSONB NOT NULL DEFAULT '{}',
    descripcion  TEXT,
    categoria  TEXT NOT NULL,
    tags  JSONB NOT NULL DEFAULT '[]',
    destacado  BOOLEAN NOT NULL DEFAULT FALSE,
    activo  BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_productos_timestamp
BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

/* Usuarios */
CREATE TABLE IF NOT EXISTS usuarios (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre  TEXT NOT NULL,
    apellidos  TEXT NOT NULL,
    email  TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    rol  TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    verificado  BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_usuarios_timestamp
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

/* Tokens de verificación de email */
CREATE TABLE IF NOT EXISTS tokens_verificacion (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token  TEXT NOT NULL UNIQUE,
    expira_en  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    usado  BOOLEAN NOT NULL DEFAULT FALSE
);

/* Refresh tokens */
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token  TEXT NOT NULL UNIQUE,
    expira_en  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    revocado  BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Intentos de login para rate limiting por email */
CREATE TABLE IF NOT EXISTS intentos_login (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email  TEXT NOT NULL,
    ip  TEXT,
    exitoso  BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Carrito persistente */
CREATE TABLE IF NOT EXISTS carrito_items (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id  TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    talla  TEXT NOT NULL,
    cantidad  INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, producto_id, talla)
);

/* Favoritos */
CREATE TABLE IF NOT EXISTS favoritos (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id  TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, producto_id)
);

/* Pedidos */
CREATE TABLE IF NOT EXISTS pedidos (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    email  TEXT NOT NULL,
    nombre  TEXT NOT NULL,
    apellidos  TEXT NOT NULL,
    direccion  JSONB NOT NULL DEFAULT '{}',
    total  NUMERIC(10, 2) NOT NULL,
    envio  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    estado  TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado')),
    nota  TEXT,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_pedidos_timestamp
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

/* Items de pedido */
CREATE TABLE IF NOT EXISTS pedido_items (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id  UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id  TEXT NOT NULL,
    nombre_producto  TEXT NOT NULL,
    talla  TEXT NOT NULL,
    cantidad  INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL
);

/* Datos iniciales - 5 productos del catálogo */
INSERT INTO productos (id, nombre, precio_numerico, precio_str, color, imagenes, tallas, stock, detalles, descripcion, categoria, tags, destacado)
VALUES
(
    'white-tshirt', 'WHITE TSHIRT', 29.99, '29,99€', 'blanco',
    '["/public/assets/images/products/camiseta-blanca-delante.png","/public/assets/images/products/camiseta-blanca-detras.png","/public/assets/images/products/modelo-camiseta-blanca-delante.png","/public/assets/images/products/modelo-camiseta-blanca-detras.png"]',
    '["S","M","L","XL"]', '{"S":10,"M":15,"L":12,"XL":8}',
    '{"composicion":"Algodón 100%","corte":"Cropped fit","cuidado":"Lavar a máquina 30°C","origen":"Hecho en España"}',
    'Camiseta básica de algodón 100% con diseño minimalista.',
    'camisetas', '["básicos","algodón","unisex"]', TRUE
),
(
    'cream-tshirt', 'CREAM TSHIRT', 29.99, '29,99€', 'crema',
    '["/public/assets/images/products/camiseta-crema-delante.png","/public/assets/images/products/camiseta-crema-detras.png","/public/assets/images/products/modelo-camiseta-crema-delante.png","/public/assets/images/products/modelo-camiseta-crema-detras.png"]',
    '["S","M","L","XL"]', '{"S":8,"M":12,"L":10,"XL":6}',
    '{"composicion":"Algodón 100%","corte":"Regular fit","cuidado":"Lavar a máquina 30°C","origen":"Hecho en España"}',
    'Camiseta en tono crema de algodón premium. Un básico atemporal.',
    'camisetas', '["básicos","algodón","unisex"]', TRUE
),
(
    'grey-tshirt', 'GREY TSHIRT', 29.99, '29,99€', 'gris',
    '["/public/assets/images/products/camiseta-gris-delante.png","/public/assets/images/products/camiseta-gris-detras.png","/public/assets/images/products/modelo-camiseta-gris-delante.png","/public/assets/images/products/modelo-camiseta-gris-detras.png"]',
    '["S","M","L","XL"]', '{"S":9,"M":14,"L":11,"XL":7}',
    '{"composicion":"Algodón 100%","corte":"Relaxed fit","cuidado":"Lavar a máquina 30°C","origen":"Hecho en España"}',
    'Camiseta gris de corte relajado. Versátil y cómoda.',
    'camisetas', '["básicos","algodón","unisex"]', TRUE
),
(
    'black-tshirt', 'BLACK TSHIRT', 29.99, '29,99€', 'negro',
    '["/public/assets/images/products/camiseta-negra-delante.png","/public/assets/images/products/camiseta-negra-detras.png","/public/assets/images/products/modelo-camiseta-negra-delante.png","/public/assets/images/products/modelo-camiseta-negra-detras.png"]',
    '["S","M","L","XL"]', '{"S":12,"M":18,"L":15,"XL":10}',
    '{"composicion":"Algodón 100%","corte":"Relaxed fit","cuidado":"Lavar a máquina 30°C","origen":"Hecho en España"}',
    'Camiseta negra de corte relajado. Esencial en cualquier armario.',
    'camisetas', '["básicos","algodón","unisex"]', TRUE
),
(
    'black-texture-tshirt', 'BLACK TEXTURE TSHIRT', 34.99, '34,99€', 'negro',
    '["/public/assets/images/products/camiseta-negra-textura-delante.png","/public/assets/images/products/camiseta-negra-textura-detras.png","/public/assets/images/products/modelo-camiseta-negra-textura-delante.png","/public/assets/images/products/modelo-camiseta-negro-textura-detras.png"]',
    '["S","M","L","XL"]', '{"S":6,"M":10,"L":8,"XL":5}',
    '{"composicion":"Algodón 100% texturizado","corte":"Oversized fit","cuidado":"Lavar a máquina 30°C","origen":"Hecho en España"}',
    'Camiseta negra con textura especial. El toque diferencial para cualquier outfit.',
    'camisetas', '["premium","textura","unisex"]', TRUE
)
ON CONFLICT (id) DO NOTHING;
