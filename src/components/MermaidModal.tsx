import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { toPng } from "html-to-image";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import "./MermaidModal.css";

interface MermaidModalProps {
    onClose: () => void;
    theme: "light" | "dark";
}

mermaid.initialize({
    startOnLoad: false,
});

const MermaidModal: React.FC<MermaidModalProps> = ({ onClose, theme }) => {
    const [code, setCode] = useState(
        `graph TD;
A[Comece aqui] --> B(Cole seu código Mermaid);
B --> C{Renderizar};
C --> D[Baixar como PNG];`
    );
    const [debouncedCode, setDebouncedCode] = useState(code);

    // --- MUDANÇA 1: REMOVER O ESTADO DO SVG ---
    // Não vamos mais guardar o SVG no estado do React.
    // const [svgCode, setSvgCode] = useState(""); 
    // --- FIM DA MUDANÇA ---

    const [error, setError] = useState("");
    const svgRef = useRef<HTMLDivElement>(null);

    // Debounce (Sem mudanças)
    useEffect(() => {
        const t = setTimeout(() => setDebouncedCode(code), 400);
        return () => clearTimeout(t);
    }, [code]);

    // Render Mermaid (Lógica de renderização alterada)
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: theme === "dark" ? "dark" : "default",
        });

        const render = async () => {
            // Se o 'ref' não estiver pronto, não faça nada
            if (!svgRef.current) return;

            if (!debouncedCode.trim()) {
                svgRef.current.innerHTML = ""; // Limpa o div
                setError("");
                return;
            }

            try {
                const id = "m-" + Math.floor(Math.random() * 999999);
                const { svg } = await mermaid.render(id, debouncedCode);

                // --- MUDANÇA 2: Manipulação Direta do DOM ---
                // Em vez de 'setSvgCode(svg)', nós escrevemos
                // diretamente no 'div' que o 'ref' está a apontar.
                // Como o React não vê esta mudança, o TransformWrapper não reinicia.
                svgRef.current.innerHTML = svg;
                // --- FIM DA MUDANÇA ---

                setError("");
            } catch (err: any) {
                svgRef.current.innerHTML = ""; // Limpa em caso de erro
                setError(err.message || "Erro ao renderizar Mermaid");
            }
        };

        render();
    }, [debouncedCode, theme]); // Reage ao código "atrasado"

    // Download (Lógica de 'wrapper' sem mudanças, está correta)
    const handleDownload = () => {
        const svgElement = svgRef.current?.querySelector("svg");

        if (!svgElement) return;

        const clone = svgElement.cloneNode(true) as SVGSVGElement;
        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.top = "-9999px";
        wrapper.style.background = theme === "dark" ? "#121212" : "#ffffff";

        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);

        toPng(wrapper)
            .then((url) => {
                const link = document.createElement("a");
                link.download = "fluxograma.png";
                link.href = url;
                link.click();
            })
            .finally(() => {
                wrapper.remove();
            });
    };

    return (
        <div className="mm-overlay" onClick={onClose}>
            <div className="mm-content" onClick={(e) => e.stopPropagation()}>
                <div className="mm-header">
                    <h3>Renderizador Mermaid</h3>
                    <button className="mm-close" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="mm-body">
                    {/* COLUNA EDITOR */}
                    <div className="mm-editor">
                        <label>Código Mermaid</label>
                        <textarea value={code} onChange={(e) => setCode(e.target.value)} />
                    </div>

                    {/* COLUNA PREVIEW */}
                    <div className="mm-preview">
                        <label>Pré-visualização (Zoom e Pan habilitados)</label>

                        <div className="mm-preview-area">
                            <TransformWrapper
                                initialScale={1}
                                minScale={0.2}
                                limitToBounds={false}
                            >
                                <TransformComponent>
                                    {/* --- MUDANÇA 3: Div Vazio --- */}
                                    {/* Este 'div' é agora permanente e vazio. */}
                                    {/* O 'useEffect' acima irá preenchê-lo com o SVG. */}
                                    <div
                                        ref={svgRef}
                                        className="mm-svg-container"
                                    />
                                    {/* --- FIM DA MUDANÇA --- */}
                                </TransformComponent>
                            </TransformWrapper>

                            {error && <div className="mm-error">{error}</div>}
                        </div>
                    </div>
                </div>

                <div className="mm-footer">
                    <button
                        className="mm-download-btn"
                        onClick={handleDownload}
                        // Desativa se houver um erro (o svgRef não terá conteúdo)
                        disabled={!!error || !svgRef.current?.innerHTML}
                    >
                        Baixar PNG
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MermaidModal;