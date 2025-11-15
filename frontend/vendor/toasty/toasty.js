(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Toasty = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    class Toasty {
        constructor(options = {}) {
            this._defaults = {
                classname: 'toasty',
                duration: 3500,
                gravity: 'top',
                position: 'right',
                close: true,
                progressBar: true,
                insertBefore: false,
                autoClose: true,
                text: '',
                className: '',
                allowHtml: false,
                callback: null
            };

            this._options = { ...this._defaults, ...options };
            this._containerCache = new Map();
        }

        options(newOptions = {}) {
            this._options = { ...this._options, ...newOptions };
        }

        _resolveContainer(gravity, position) {
            const key = `${gravity}-${position}`;
            if (this._containerCache.has(key)) {
                return this._containerCache.get(key);
            }

            const container = document.createElement('div');
            container.className = `toasty-container ${gravity} ${position}`;
            container.dataset.gravity = gravity;
            container.dataset.position = position;
            document.body.appendChild(container);
            this._containerCache.set(key, container);
            return container;
        }

        _buildToast(options) {
            const toast = document.createElement('div');
            toast.className = `${this._options.classname} ${options.className || ''}`.trim();

            const content = document.createElement('div');
            content.className = 'toasty-content';
            if (options.allowHtml) {
                content.innerHTML = options.text || '';
            } else {
                content.textContent = options.text || '';
            }
            toast.appendChild(content);

            if (options.close) {
                const closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'toasty-close';
                closeBtn.setAttribute('aria-label', 'Cerrar notificación');
                closeBtn.innerHTML = '&times;';
                closeBtn.addEventListener('click', () => this._dismiss(toast));
                toast.appendChild(closeBtn);
            }

            if (options.progressBar && options.autoClose && options.duration > 0) {
                const progressWrapper = document.createElement('div');
                progressWrapper.className = 'toasty-progress';
                const progress = document.createElement('span');
                progress.style.animationDuration = `${options.duration}ms`;
                progressWrapper.appendChild(progress);
                toast.appendChild(progressWrapper);
            }

            requestAnimationFrame(() => toast.classList.add('show'));
            return toast;
        }

        _dismiss(toast) {
            if (!toast) return;
            toast.classList.remove('show');
            const remove = () => {
                toast.removeEventListener('transitionend', remove);
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            };
            toast.addEventListener('transitionend', remove);
            toast.dispatchEvent(new CustomEvent('toasty:dismiss'));
        }

        show() {
            const opts = { ...this._defaults, ...this._options };
            if (!opts.text) return;

            const gravity = ['top', 'bottom'].includes(opts.gravity) ? opts.gravity : 'top';
            const position = ['left', 'right', 'center'].includes(opts.position) ? opts.position : 'right';
            const container = this._resolveContainer(gravity, position);

            const toast = this._buildToast(opts);
            const extraClasses = (opts.className || 'info').split(/\s+/).filter(Boolean);
            extraClasses.forEach(cls => toast.classList.add(cls));

            if (opts.insertBefore && container.firstChild) {
                container.insertBefore(toast, container.firstChild);
            } else {
                container.appendChild(toast);
            }

            let autoCloseTimer = null;
            if (opts.autoClose && opts.duration > 0) {
                autoCloseTimer = setTimeout(() => this._dismiss(toast), opts.duration);
            }

            const clear = () => {
                if (autoCloseTimer) {
                    clearTimeout(autoCloseTimer);
                    autoCloseTimer = null;
                }
            };

            toast.addEventListener('pointerenter', clear);
            toast.addEventListener('pointerleave', () => {
                if (!autoCloseTimer && opts.autoClose && opts.duration > 0) {
                    autoCloseTimer = setTimeout(() => this._dismiss(toast), opts.duration);
                }
            });

            toast.addEventListener('toasty:dismiss', () => {
                if (typeof opts.callback === 'function') {
                    opts.callback();
                }
            }, { once: true });

            return toast;
        }
    }

    return Toasty;
}));
