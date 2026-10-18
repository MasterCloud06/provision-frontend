import { Component, type ReactNode } from 'react';

/** Si algo falla al dibujar la página, muestra un aviso con salida en vez de una pantalla en blanco. */
export class ErrorGeneral extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Error en la tienda:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main style={{ maxWidth: 560, margin: '15vh auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
        <h1 style={{ fontSize: '1.6rem' }}>Algo salió mal al mostrar la página</h1>
        <p>
          Vuelve a cargarla. Si sigue pasando, prueba en una ventana privada o desactiva las extensiones del navegador
          (algunas modifican las páginas y las rompen).
        </p>
        <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => location.reload()} style={{ padding: '10px 18px', cursor: 'pointer' }}>
            Volver a cargar
          </button>
          <a href={import.meta.env.BASE_URL} style={{ padding: '10px 0' }}>
            Ir al inicio
          </a>
        </p>
      </main>
    );
  }
}
