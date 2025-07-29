/**
 * WebGL Path Layer for Google Maps
 *
 * This class extends google.maps.WebGLOverlayView to provide efficient rendering
 * of complex routes with many points using WebGL.
 */

declare global {
    interface Window {
        google: any;
    }
}

export class WebGLPathLayer {
    private points: google.maps.LatLngLiteral[] = [];
    private color: string = '#4285F4';
    private lineWidth: number = 3;
    private map: google.maps.Map | null = null;
    private overlayView: any = null;

    constructor(points: google.maps.LatLngLiteral[], options?: { color?: string, lineWidth?: number }) {
        this.points = points;
        if (options?.color) {
            this.color = options.color;
        }
        if (options?.lineWidth) {
            this.lineWidth = options.lineWidth;
        }

        // Create overlay view if WebGLOverlayView is available
        if (this.isWebGLOverlayViewAvailable()) {
            this.createWebGLOverlay();
        } else {
            console.warn('WebGLOverlayView is not available, falling back to Canvas overlay');
            this.createCanvasOverlay();
        }
    }

    private isWebGLOverlayViewAvailable(): boolean {
        return typeof window !== 'undefined' &&
            window.google &&
            window.google.maps &&
            window.google.maps.WebGLOverlayView;
    }

    private createWebGLOverlay(): void {
        const WebGLOverlayView = window.google.maps.WebGLOverlayView;

        this.overlayView = new WebGLOverlayView();

        this.overlayView.onAdd = () => {
            // No specific implementation needed
        };

        this.overlayView.onContextLost = () => {
            // No specific implementation needed
        };

        this.overlayView.onContextRestored = () => {
            // No specific implementation needed
        };

        this.overlayView.onRemove = () => {
            // No specific implementation needed
        };

        this.overlayView.onDraw = (options: any) => {
            this.onDraw(options);
        };
    }

    private createCanvasOverlay(): void {
        // Fallback to Canvas-based overlay for better compatibility
        this.overlayView = new window.google.maps.OverlayView();

        this.overlayView.onAdd = () => {
            const div = document.createElement('div');
            div.style.borderStyle = 'none';
            div.style.borderWidth = '0px';
            div.style.position = 'absolute';

            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            div.appendChild(canvas);

            this.overlayView.canvas = canvas;
            this.overlayView.div = div;

            const panes = this.overlayView.getPanes();
            panes.overlayLayer.appendChild(div);
        };

        this.overlayView.draw = () => {
            this.drawCanvas();
        };

        this.overlayView.onRemove = () => {
            if (this.overlayView.div) {
                this.overlayView.div.parentNode?.removeChild(this.overlayView.div);
                this.overlayView.div = null;
            }
        };
    }

    private drawCanvas(): void {
        if (!this.overlayView.canvas || !this.map) return;

        const canvas = this.overlayView.canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const overlayProjection = this.overlayView.getProjection();
        if (!overlayProjection) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set line style
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw path
        ctx.beginPath();

        for (let i = 0; i < this.points.length; i++) {
            const point = overlayProjection.fromLatLngToDivPixel(
                new window.google.maps.LatLng(this.points[i].lat, this.points[i].lng)
            );

            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }

        ctx.stroke();
    }

    setMap(map: google.maps.Map | null): void {
        this.map = map;
        if (this.overlayView) {
            try {
                this.overlayView.setMap(map);
            } catch (error) {
                console.warn('WebGL overlay failed, falling back to Canvas overlay:', error);
                // If WebGL overlay fails, create and use canvas overlay instead
                this.createCanvasOverlay();
                if (this.overlayView) {
                    this.overlayView.setMap(map);
                }
            }
        }
    }

    private onDraw(options: any): void {
        if (this.points.length < 2) return;

        const {gl, transformer} = options;

        // Create a buffer for the vertices
        const vertices = new Float32Array(this.points.length * 2);

        // Transform the geographic coordinates to screen coordinates
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const screenCoord = transformer.fromLatLngAltitude({
                lat     : point.lat,
                lng     : point.lng,
                altitude: 0
            });
            // screenCoord is a Float64Array, access elements directly
            vertices[i * 2] = screenCoord[0];
            vertices[i * 2 + 1] = screenCoord[1];
        }

        // Create and configure the shader for drawing the line
        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, `
            precision mediump float;
            uniform vec4 color;
            void main() {
                gl_FragColor = color;
            }
        `);
        gl.compileShader(fragmentShader);

        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        // Convert the color hexadecimal to RGB components
        const r = parseInt(this.color.substring(1, 3), 16) / 255;
        const g = parseInt(this.color.substring(3, 5), 16) / 255;
        const b = parseInt(this.color.substring(5, 7), 16) / 255;

        // Set the color uniform
        const colorLocation = gl.getUniformLocation(program, 'color');
        gl.uniform4f(colorLocation, r, g, b, 1.0);

        // Create and bind the vertex buffer
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Configure the position attribute
        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Draw the line
        gl.lineWidth(this.lineWidth);
        gl.drawArrays(gl.LINE_STRIP, 0, this.points.length);

        // Clean up
        gl.disableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(null);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }
}
