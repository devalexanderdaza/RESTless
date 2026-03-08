/**
 * Clase base para componentes de UI
 */
export class Component {
    protected element: HTMLElement;
  
    constructor(tagName: string = 'div', className: string = '') {
      this.element = document.createElement(tagName);
      if (className) {
        this.element.className = className;
      }
    }
  
    /**
     * Obtiene el elemento DOM del componente
     */
    public getElement(): HTMLElement {
      return this.element;
    }
  
    /**
     * Agrega el componente a un elemento padre
     */
    public appendTo(parent: HTMLElement | Component): void {
      if (parent instanceof Component) {
        parent.getElement().appendChild(this.element);
      } else {
        parent.appendChild(this.element);
      }
    }
  
    /**
     * Elimina el componente del DOM
     */
    public remove(): void {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  
    /**
     * Actualiza el contenido del componente
     */
    public setContent(content: string): void {
      this.element.innerHTML = content;
    }
  
    /**
     * Actualiza los atributos del componente
     */
    public setAttribute(name: string, value: string): void {
      this.element.setAttribute(name, value);
    }
  
    /**
     * Agrega clases al componente
     */
    public addClass(className: string): void {
      this.element.classList.add(className);
    }
  
    /**
     * Elimina clases del componente
     */
    public removeClass(className: string): void {
      this.element.classList.remove(className);
    }
  
    /**
     * Alterna una clase en el componente
     */
    public toggleClass(className: string): void {
      this.element.classList.toggle(className);
    }
  }