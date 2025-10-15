// Función para validar RUT chileno
function validarRut(rut) {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace('-', '');
    
    // Obtener dígito verificador
    const dv = rut.slice(-1);
    const rutNumero = parseInt(rut.slice(0, -1), 10);
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    // Convertir RUT a string para iterar sobre sus dígitos
    let rutString = rutNumero.toString();
    
    // Iterar de derecha a izquierda
    for (let i = rutString.length - 1; i >= 0; i--) {
        suma += parseInt(rutString.charAt(i), 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    let dvCalculado;
    
    if (dvEsperado === 11) {
        dvCalculado = '0';
    } else if (dvEsperado === 10) {
        dvCalculado = 'K';
    } else {
        dvCalculado = dvEsperado.toString();
    }
    
    return dvCalculado.toLowerCase() === dv.toLowerCase();
}

// Función para formatear automáticamente RUT mientras se escribe
function formatRutInput(input) {
    // Guardar la posición del cursor y la longitud anterior para restaurarla correctamente
    let cursorPosition = 0;
    let previousLength = 0;
    
    // Función auxiliar para formatear el RUT correctamente
    function formatRut(value) {
        // Eliminar puntos y guión
        value = value.replace(/\./g, '').replace('-', '');
        
        // Obtener solo números y la letra K (mayúscula o minúscula)
        value = value.replace(/[^\dkK]/g, '');
        
        // Separar el dígito verificador
        let dv = '';
        if (value.length > 0) {
            dv = value.slice(-1);
            value = value.slice(0, -1);
        }
        
        // Formatear con puntos
        let formattedValue = '';
        let i = value.length;
        
        while (i > 0) {
            const chunk = i >= 3 ? value.slice(i - 3, i) : value.slice(0, i);
            formattedValue = chunk + (formattedValue ? '.' + formattedValue : '');
            i -= 3;
        }
        
        // Añadir el guión y el dígito verificador
        if (dv) {
            formattedValue += '-' + dv;
        }
        
        return formattedValue;
    }
    
    input.addEventListener('input', function(e) {
        try {
            // Guardar la posición del cursor antes de modificar el valor
            cursorPosition = this.selectionStart;
            previousLength = this.value.length;
            
            // Obtener el valor formateado
            const formattedValue = formatRut(this.value);
            
            // Actualizar el valor del input
            this.value = formattedValue;
            
            // Calcular la nueva posición del cursor
            let newPosition = cursorPosition;
            
            // Ajustar la posición si se añadieron caracteres (puntos o guión)
            if (formattedValue.length > previousLength) {
                const addedChars = formattedValue.length - previousLength;
                newPosition = Math.min(cursorPosition + addedChars, formattedValue.length);
            }
            
            // Establecer la nueva posición del cursor
            if (typeof this.setSelectionRange === 'function') {
                this.setSelectionRange(newPosition, newPosition);
            }
        } catch (error) {
            console.warn('Error al formatear RUT:', error);
        }
    });
    
    // También manejar el pegado para formatear inmediatamente
    input.addEventListener('paste', function(e) {
        // Pequeño retraso para permitir que el evento de pegado complete
        setTimeout(() => {
            try {
                // Formatear el valor pegado
                this.value = formatRut(this.value);
            } catch (error) {
                console.warn('Error al formatear RUT pegado:', error);
            }
        }, 0);
    });
}

// Función para validar formato de email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para formatear fecha en formato DD-MM-YYYY
function formatearFechaEnvio() {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}-${mes}-${año}`;
}

// Función para validar campos de observaciones obligatorios
function validarObservacionesObligatorias(inputId, nombreCampo = 'observaciones') {
    const input = document.getElementById(inputId);
    if (!input || !input.value.trim()) {
        alert(`Por favor, complete el campo de ${nombreCampo}.`);
        return false;
    }
    return true;
}

// Variables globales
let exhibicionesData = [];
let editingIndex = -1;
let currentStep = 'validacion-inicial';

// Variables globales para almacenar datos de validación inicial
let validacionInicialData = {
    rut: '',
    tipoUsuario: '',
    emailValidacion: ''
};

// Variables globales para funciones
let navigateToStepGlobal = null;
let resetFormGlobal = null;

// Función para enviar datos a Power Automate
function enviarDatosAPowerAutomate(datos, tipoSolicitud) {
    const powerAutomateUrl = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/971fb86a29204a7aaaa83de432406db9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=09izjqz5nu4vqRe_PDvYq9iyx2r2WWSUrZqhwWTARSc';
    
    // Agregar logging para debug
    console.log('Enviando datos:', JSON.stringify({
        tipoSolicitud: tipoSolicitud,
        datos: datos,
        fechaEnvio: formatearFechaEnvio()
    }, null, 2));
    
    // Mostrar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Enviando solicitud...</p>';
    loadingIndicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    `;
    document.body.appendChild(loadingIndicator);
    
    fetch(powerAutomateUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tipoSolicitud: tipoSolicitud,
            datos: datos,
            fechaEnvio: formatearFechaEnvio()
        })
    })
    .then(response => {
        document.body.removeChild(loadingIndicator);
        
        // Agregar logging para debug
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            alert('Su solicitud ha sido enviada con éxito. Nos pondremos en contacto con usted a la brevedad.');
            // Usar las funciones globales si están disponibles
            if (navigateToStepGlobal) {
                navigateToStepGlobal('inicio');
            }
            if (resetFormGlobal) {
                resetFormGlobal();
            }
        } else {
            // Intentar obtener más información del error
            response.text().then(errorText => {
                console.error('Error response body:', errorText);
                alert('Ha ocurrido un error al enviar su solicitud. Por favor, inténtelo nuevamente más tarde.');
            });
            console.error('Error al enviar datos:', response.status);
        }
    })
    .catch(error => {
        document.body.removeChild(loadingIndicator);
        alert('Ha ocurrido un error al enviar su solicitud. Por favor, inténtelo nuevamente más tarde.');
        console.error('Error al enviar datos:', error);
    });
}

// Función para formatear automáticamente fechas mientras se escribe
function formatDateInput(input) {
    // Guardar la posición del cursor y la longitud anterior para restaurarla correctamente
    let cursorPosition = 0;
    let previousLength = 0;
    
    // Función auxiliar para formatear la fecha correctamente
    function formatDate(value) {
        // Asegurarse de que solo tenemos dígitos
        value = value.replace(/\D/g, '');
        
        // Limitar a 8 dígitos (ddmmyyyy)
        if (value.length > 8) {
            value = value.slice(0, 8);
        }
        
        // Formatear con guiones
        let formattedValue = value;
        
        if (value.length >= 5) {
            // Formato completo dd-mm-yyyy o parcial dd-mm-y...
            formattedValue = value.substring(0, 2) + '-' + value.substring(2, 4) + '-' + value.substring(4);
        } else if (value.length >= 3) {
            // Formato parcial dd-m...
            formattedValue = value.substring(0, 2) + '-' + value.substring(2);
        }
        
        return formattedValue;
    }
    
    input.addEventListener('input', function(e) {
        // Verificar que el input no sea de tipo hidden antes de continuar
        if (this.type === 'hidden') return;
        
        try {
            // Guardar la posición del cursor antes de modificar el valor
            cursorPosition = this.selectionStart;
            previousLength = this.value.length;
            
            // Obtener el valor formateado
            const formattedValue = formatDate(this.value);
            
            // Actualizar el valor del input
            this.value = formattedValue;
            
            // Solo intentar establecer la selección si el elemento no es de tipo hidden
            if (this.type !== 'hidden' && typeof this.setSelectionRange === 'function') {
                // Calcular la nueva posición del cursor
                let newPosition = cursorPosition;
                
                // Ajustar la posición si se añadieron guiones
                if (cursorPosition === 2 && formattedValue.charAt(2) === '-') {
                    // Si el cursor está después del día y hay un guión, moverlo después del guión
                    newPosition = 3;
                } else if (cursorPosition === 5 && formattedValue.charAt(5) === '-') {
                    // Si el cursor está después del mes y hay un guión, moverlo después del guión
                    newPosition = 6;
                } else if (formattedValue.length > previousLength) {
                    // Si se añadieron caracteres (guiones), ajustar la posición
                    const addedChars = formattedValue.length - previousLength;
                    newPosition = Math.min(cursorPosition + addedChars, formattedValue.length);
                }
                
                // Establecer la nueva posición del cursor
                this.setSelectionRange(newPosition, newPosition);
            }
        } catch (error) {
            console.warn('Error al formatear fecha:', error);
        }
    });
    
    // También manejar el pegado para formatear inmediatamente
    input.addEventListener('paste', function(e) {
        // Verificar que el input no sea de tipo hidden antes de continuar
        if (this.type === 'hidden') return;
        
        // Pequeño retraso para permitir que el evento de pegado complete
        setTimeout(() => {
            try {
                // Formatear el valor pegado
                this.value = formatDate(this.value);
            } catch (error) {
                console.warn('Error al formatear fecha pegada:', error);
            }
        }, 0);
    });
}

// Función para inicializar el formateo de RUT en campos correspondientes
function initializeRutFormatting() {
    // Seleccionar todos los inputs que tengan placeholder con formato de RUT o contengan "rut" en su id o name
    const rutInputs = document.querySelectorAll('input[placeholder*="RUT"], input[id*="rut"], input[name*="rut"], input[id*="Rut"], input[name*="Rut"]');
    
    if (rutInputs.length > 0) {
        console.log('Inicializando formateo de RUT en', rutInputs.length, 'campos');
        
        rutInputs.forEach(input => {
            // Aplicar formateo automático mientras se escribe
            formatRutInput(input);
        });
    } else {
        console.warn('No se encontraron campos de RUT para inicializar formateo');
    }
}

// Función para inicializar datepickers en campos de fecha
function initializeDatepickers() {
    // Seleccionar todos los inputs que tengan placeholder con formato de fecha o sean de tipo date
    const dateInputs = document.querySelectorAll('input[placeholder*="dd-mm-yyyy"], input[placeholder*="dd/mm/yyyy"], input[type="date"], input[id*="fecha"]');
    
    if (dateInputs.length > 0) {
        console.log('Inicializando datepickers en', dateInputs.length, 'campos');
        
        dateInputs.forEach(input => {
            // Aplicar formateo automático mientras se escribe
            formatDateInput(input);
            
            // Asegurarse de que flatpickr esté disponible
            if (typeof flatpickr === 'function') {
                try {
                    // Configurar flatpickr en español
                    if (flatpickr.l10ns && flatpickr.l10ns.es) {
                        flatpickr.localize(flatpickr.l10ns.es);
                    }
                    
                    // Configuración para que flatpickr no interfiera con el formateo manual
                    flatpickr(input, {
                        dateFormat: "d-m-Y",
                        allowInput: true,
                        // Desactivar altInput para evitar que cree un campo oculto
                        altInput: false,
                        disableMobile: true,
                        // Función personalizada para analizar fechas en formato dd-mm-yyyy
                        parseDate: (datestr) => {
                            if (!datestr) return undefined;
                            
                            // Verificar si la fecha tiene el formato dd-mm-yyyy
                            const match = datestr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                            if (match) {
                                const day = parseInt(match[1], 10);
                                const month = parseInt(match[2], 10) - 1; // Meses en JS son 0-11
                                const year = parseInt(match[3], 10);
                                return new Date(year, month, day);
                            }
                            
                            // Si no coincide con el formato, intentar con Date.parse
                            return new Date(datestr);
                        },
                        onReady: function(selectedDates, dateStr, instance) {
                            // Añadir clase para estilos personalizados
                            instance.calendarContainer.classList.add('custom-datepicker');
                            console.log('Datepicker inicializado en', input.id || 'campo sin id');
                        },
                        onChange: function(selectedDates, dateStr, instance) {
                            // Asegurarse de que el formato sea dd-mm-yyyy
                            if (selectedDates.length > 0) {
                                const date = selectedDates[0];
                                const day = String(date.getDate()).padStart(2, '0');
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const year = date.getFullYear();
                                
                                // Actualizar el valor del input manualmente
                                input.value = `${day}-${month}-${year}`;
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error al inicializar datepicker en', input.id || 'campo sin id', error);
                }
            } else {
                console.warn('Flatpickr no está disponible. Solo se aplicará el formateo manual.');
            }
        });
    } else {
        console.warn('No se encontraron campos de fecha para inicializar datepickers');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const requestTypes = document.querySelectorAll('.request-type');
    const subsectionTypes = document.querySelectorAll('.subsection-type');
    const breadcrumb = document.getElementById('breadcrumb');
    const prevStepButtons = document.querySelectorAll('.prev-step');
    
    // Inicializar datepickers
    initializeDatepickers();
    
    // Inicializar formateo de RUT
    initializeRutFormatting();

    // Función para inicializar el breadcrumb
    function initializeBreadcrumb() {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (breadcrumbContainer) {
            breadcrumbContainer.innerHTML = '';
            
            const inicioItem = document.createElement('li');
            inicioItem.classList.add('breadcrumb-item', 'active');
            inicioItem.setAttribute('data-step', 'inicio');
            inicioItem.textContent = 'Inicio';
            inicioItem.addEventListener('click', () => {
                if (navigateToStepGlobal) {
                    navigateToStepGlobal('inicio');
                }
            });
            breadcrumbContainer.appendChild(inicioItem);
        }
    }

    // Inicializar el primer paso como activo
    const validacionInicialStep = document.getElementById('step-validacion-inicial');
    if (validacionInicialStep) {
        validacionInicialStep.classList.remove('hidden');
        validacionInicialStep.classList.add('active');
    }

    // Inicializar el breadcrumb
    initializeBreadcrumb();

    // Cargar países desde el archivo JSON
    function cargarPaises() {
        const rutaAbsoluta = window.location.origin + '/assets/paises.json';
        
        fetch(rutaAbsoluta, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const paisSelects = document.querySelectorAll('select[id$="-pais"], #exhibicion-pais, #pais');
            
            paisSelects.forEach(paisSelect => {
                if (!paisSelect) return;
                
                // Limpiar opciones existentes excepto la primera
                while (paisSelect.options.length > 1) {
                    paisSelect.remove(1);
                }
                
                // Agregar cada país como una opción
                data.forEach(pais => {
                    const option = document.createElement('option');
                    option.value = pais['Nombre del país'];
                    option.textContent = pais['Nombre del país'];
                    paisSelect.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar los países:', error);
        });
    }

    // Cargar países al iniciar la página
    cargarPaises();
 
   // Función para actualizar el breadcrumb
    function updateBreadcrumb(currentStep, addStep = true) {
        if (addStep) {
            const items = breadcrumb.querySelectorAll('.breadcrumb-item');
            items.forEach(item => {
                item.classList.remove('active');
            });
            
            const existingItem = breadcrumb.querySelector(`[data-step="${currentStep}"]`);
            
            if (existingItem) {
                existingItem.classList.add('active');
                
                let nextSibling = existingItem.nextElementSibling;
                while (nextSibling) {
                    const temp = nextSibling.nextElementSibling;
                    breadcrumb.removeChild(nextSibling);
                    nextSibling = temp;
                }
            } else {
                const newItem = document.createElement('li');
                newItem.classList.add('breadcrumb-item', 'active');
                newItem.setAttribute('data-step', currentStep);
                
                // Establecer el texto según el paso
                const stepNames = {
                    'inicio': 'Inicio',
                    'actualizacion': 'Actualización de información',
                    'datos-personales': 'Datos personales',
                    'datos-contacto': 'Datos de contacto',
                    'datos-bancarios': 'Datos bancarios',
                    'datos-autor': 'Datos de autor',
                    'ambito-clase': 'Ámbito o Clase',
                    'sociedades': 'Sociedades',
                    'exhibicion': 'Notificación de exhibición de obra en el extranjero',
                    'conflicto': 'Declaración de conflicto en obra',
                    'certificado': 'Solicitud de certificado',
                    'afiliacion': 'Certificado de Afiliación',
                    'derechos-recibidos': 'Certificado de Derechos Recibidos',
                    'desafiliacion': 'Desafiliación'
                };
                
                newItem.textContent = stepNames[currentStep] || currentStep;
                
                breadcrumb.appendChild(newItem);
            }
            
            // Siempre agregar event listeners después de cualquier cambio
            addBreadcrumbListeners();
        } else {
            const items = breadcrumb.querySelectorAll('.breadcrumb-item');
            items.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-step') === currentStep) {
                    item.classList.add('active');
                }
            });
            
            // Asegurar que los event listeners estén presentes
            addBreadcrumbListeners();
        }
    }

    // Función para navegar a un paso específico
    function navigateToStep(step) {
        limpiarCamposFormulario();
        
        if (step === 'inicio') {
            const breadcrumbContainer = document.getElementById('breadcrumb');
            breadcrumbContainer.innerHTML = '';
            
            const inicioItem = document.createElement('li');
            inicioItem.classList.add('breadcrumb-item', 'active');
            inicioItem.setAttribute('data-step', 'inicio');
            inicioItem.textContent = 'Inicio';
            inicioItem.addEventListener('click', () => {
                if (navigateToStepGlobal) {
                    navigateToStepGlobal('inicio');
                }
            });
            breadcrumbContainer.appendChild(inicioItem);
        } else {
            updateBreadcrumb(step, false);
        }
        
        const currentActiveStep = document.querySelector('.carousel-step.active');
        if (currentActiveStep) {
            currentActiveStep.classList.add('slide-out');
            currentActiveStep.classList.remove('active');
            
            setTimeout(() => {
                currentActiveStep.classList.add('hidden');
                currentActiveStep.classList.remove('slide-out');
                
                const targetStep = document.getElementById(`step-${step}`);
                if (targetStep) {
                    targetStep.classList.remove('hidden');
                    setTimeout(() => {
                        targetStep.classList.add('active');
                        
                        // Mostrar formularios automáticamente para ciertas secciones
                        if (step === 'datos-contacto') {
                            const updateOptionsContacto = document.getElementById('update-options-contacto');
                            if (updateOptionsContacto) {
                                updateOptionsContacto.classList.remove('hidden');
                            }
                        } else if (step === 'datos-bancarios') {
                            const updateOptionsBancarios = document.getElementById('update-options-bancarios');
                            if (updateOptionsBancarios) {
                                updateOptionsBancarios.classList.remove('hidden');
                            }
                        } else if (step === 'ambito-clase') {
                            const ambitoClaseForm = document.getElementById('ambito-clase-form');
                            if (ambitoClaseForm) {
                                ambitoClaseForm.classList.remove('hidden');
                            }
                        } else if (step === 'sociedades') {
                            const sociedadesContainer = document.getElementById('sociedades-container');
                            if (sociedadesContainer) {
                                sociedadesContainer.classList.remove('hidden');
                            }
                        }
                    }, 50);
                }
            }, 500);
        } else {
            const targetStep = document.getElementById(`step-${step}`);
            if (targetStep) {
                targetStep.classList.remove('hidden');
                setTimeout(() => {
                    targetStep.classList.add('active');
                    
                    // Mostrar formularios automáticamente para ciertas secciones
                    if (step === 'datos-contacto') {
                        const updateOptionsContacto = document.getElementById('update-options-contacto');
                        if (updateOptionsContacto) {
                            updateOptionsContacto.classList.remove('hidden');
                        }
                    } else if (step === 'datos-bancarios') {
                        const updateOptionsBancarios = document.getElementById('update-options-bancarios');
                        if (updateOptionsBancarios) {
                            updateOptionsBancarios.classList.remove('hidden');
                        }
                    } else if (step === 'ambito-clase') {
                        const ambitoClaseForm = document.getElementById('ambito-clase-form');
                        if (ambitoClaseForm) {
                            ambitoClaseForm.classList.remove('hidden');
                        }
                    } else if (step === 'sociedades') {
                        const sociedadesContainer = document.getElementById('sociedades-container');
                        if (sociedadesContainer) {
                            sociedadesContainer.classList.remove('hidden');
                        }
                    }
                }, 50);
            }
        }
    }

    // Función para limpiar todos los campos del formulario
    function limpiarCamposFormulario() {
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.value = '';
        });
        
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        document.querySelectorAll('.field-container:not(.hidden)').forEach(container => {
            container.classList.add('hidden');
        });
        
        const nombreObraField = document.getElementById('nombre-obra-field');
        if (nombreObraField) {
            nombreObraField.classList.add('hidden');
        }
    }

    // Función para agregar event listeners al breadcrumb
    function addBreadcrumbListeners() {
        const breadcrumbItems = breadcrumb.querySelectorAll('.breadcrumb-item');
        breadcrumbItems.forEach(item => {
            // Remover listeners existentes clonando el elemento
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Agregar nuevo listener
            newItem.addEventListener('click', () => {
                const step = newItem.getAttribute('data-step');
                if (step && navigateToStepGlobal) {
                    // Eliminar todos los elementos posteriores al clickeado
                    let nextSibling = newItem.nextElementSibling;
                    while (nextSibling) {
                        const temp = nextSibling.nextElementSibling;
                        breadcrumb.removeChild(nextSibling);
                        nextSibling = temp;
                    }
                    
                    // Activar el elemento clickeado
                    breadcrumbItems.forEach(breadcrumbItem => breadcrumbItem.classList.remove('active'));
                    newItem.classList.add('active');
                    
                    navigateToStepGlobal(step);
                }
            });
        });
    }

    // Asignar funciones a variables globales para acceso desde enviarDatosAPowerAutomate
    navigateToStepGlobal = navigateToStep;

    // Event Listeners para los tipos de solicitud
    requestTypes.forEach(type => {
        type.addEventListener('click', function() {
            const requestType = this.getAttribute('data-type');
            
            if (requestType === 'actualizacion') {
                navigateToStep('actualizacion');
                updateBreadcrumb('actualizacion');
            } else if (requestType === 'exhibicion') {
                navigateToStep('exhibicion');
                updateBreadcrumb('exhibicion');
            } else if (requestType === 'conflicto') {
                navigateToStep('conflicto');
                updateBreadcrumb('conflicto');
            } else if (requestType === 'certificado') {
                navigateToStep('certificado');
                updateBreadcrumb('certificado');
            } else if (requestType === 'desafiliacion') {
                navigateToStep('desafiliacion');
                updateBreadcrumb('desafiliacion');
            } else {
                alert('Esta funcionalidad estará disponible próximamente.');
            }
        });
    });

    // Event Listeners para las subsecciones
    subsectionTypes.forEach(subsection => {
        subsection.addEventListener('click', function() {
            const subsectionType = this.getAttribute('data-subsection');
            
            if (['datos-personales', 'datos-contacto', 'datos-bancarios', 'datos-autor'].includes(subsectionType)) {
                const items = breadcrumb.querySelectorAll('.breadcrumb-item');
                if (items.length > 2) {
                    for (let i = items.length - 1; i >= 2; i--) {
                        breadcrumb.removeChild(items[i]);
                    }
                }
                
                currentStep = subsectionType;
                navigateToStep(subsectionType);
                updateBreadcrumb(subsectionType);
            } else if (['ambito-clase', 'sociedades', 'afiliacion', 'derechos-recibidos'].includes(subsectionType)) {
                navigateToStep(subsectionType);
                updateBreadcrumb(subsectionType);
            } else {
                alert('Esta funcionalidad estará disponible próximamente.');
                navigateToStep('actualizacion');
                updateBreadcrumb('actualizacion');
            }
        });
    });

    // Event listeners para los botones de navegación
    prevStepButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevStep = button.getAttribute('data-prev');
            currentStep = prevStep;
            
            limpiarCamposFormulario();
            
            const items = breadcrumb.querySelectorAll('.breadcrumb-item');
            if (prevStep === 'actualizacion' && items.length > 2) {
                for (let i = items.length - 1; i >= 2; i--) {
                    breadcrumb.removeChild(items[i]);
                }
            }
            
            navigateToStep(prevStep);
            
            if (prevStep !== 'actualizacion') {
                updateBreadcrumb(prevStep, false);
            }
        });
    });  
  // Validadores de RUT para cada sección
    const rutValidators = [
        { buttonId: 'validate-rut-inicial', inputId: 'rut-inicial', errorId: 'rut-inicial-error', formId: 'step-inicio' },
        { buttonId: 'validate-rut', inputId: 'rut', errorId: 'rut-error', formId: 'update-options' },
        { buttonId: 'validate-rut-contacto', inputId: 'rut-contacto', errorId: 'rut-contacto-error', formId: 'update-options-contacto' },
        { buttonId: 'validate-rut-bancarios', inputId: 'rut-bancarios', errorId: 'rut-bancarios-error', formId: 'update-options-bancarios' },
        { buttonId: 'validate-rut-afiliacion', inputId: 'rut-afiliacion', errorId: 'rut-afiliacion-error', formId: 'afiliacion-form' },
        { buttonId: 'validate-rut-derechos', inputId: 'rut-derechos', errorId: 'rut-derechos-error', formId: 'derechos-form' },
        { buttonId: 'validate-rut-desafiliacion', inputId: 'rut-desafiliacion', errorId: 'rut-desafiliacion-error', formId: 'desafiliacion-form' },
        { buttonId: 'validate-rut-exhibicion', inputId: 'rut-exhibicion', errorId: 'rut-exhibicion-error', formId: 'exhibicion-container' },
        { buttonId: 'validate-rut-conflicto', inputId: 'rut-conflicto', errorId: 'rut-conflicto-error', formId: 'conflicto-form' }
    ];

    rutValidators.forEach(validator => {
        const button = document.getElementById(validator.buttonId);
        if (button) {
            button.addEventListener('click', function() {
                const rutInput = document.getElementById(validator.inputId);
                const rutError = document.getElementById(validator.errorId);
                const form = document.getElementById(validator.formId);
                
                if (!rutInput || !rutError) return;
                
                const rutValue = rutInput.value.trim();
                
                if (!rutValue) {
                    rutError.textContent = 'Por favor, ingrese un RUT del autor';
                    return;
                }
                
                // Validación de tipo de usuario para todas las secciones
                const sectionMap = {
                    'validate-rut-inicial': 'tipo-usuario-inicial',
                    'validate-rut': 'tipo-usuario',
                    'validate-rut-contacto': 'tipo-usuario-contacto',
                    'validate-rut-bancarios': 'tipo-usuario-bancarios',
                    'validate-rut-ambito': 'tipo-usuario-ambito',
                    'validate-rut-sociedades': 'tipo-usuario-sociedades',
                    'validate-rut-exhibicion': 'tipo-usuario-exhibicion',
                    'validate-rut-conflicto': 'tipo-usuario-conflicto',
                    'validate-rut-afiliacion': 'tipo-usuario-afiliacion',
                    'validate-rut-derechos': 'tipo-usuario-derechos',
                    'validate-rut-desafiliacion': 'tipo-usuario-desafiliacion'
                };
                
                const tipoUsuarioName = sectionMap[validator.buttonId];
                if (tipoUsuarioName) {
                    const tipoUsuario = document.querySelector(`input[name="${tipoUsuarioName}"]:checked`);
                    if (!tipoUsuario) {
                        rutError.textContent = 'Por favor, seleccione si es socio vigente o representante legal';
                        return;
                    }
                }
                
                // Validar correo electrónico
                const emailMap = {
                    'validate-rut': 'email-validacion',
                    'validate-rut-contacto': 'email-validacion-contacto',
                    'validate-rut-bancarios': 'email-validacion-bancarios',
                    'validate-rut-ambito': 'email-validacion-ambito',
                    'validate-rut-sociedades': 'email-validacion-sociedades',
                    'validate-rut-exhibicion': 'email-validacion-exhibicion',
                    'validate-rut-conflicto': 'email-validacion-conflicto',
                    'validate-rut-afiliacion': 'email-validacion-afiliacion',
                    'validate-rut-derechos': 'email-validacion-derechos',
                    'validate-rut-desafiliacion': 'email-validacion-desafiliacion'
                };
                
                const emailInputId = emailMap[validator.buttonId];
                if (emailInputId) {
                    const emailInput = document.getElementById(emailInputId);
                    if (!emailInput || !emailInput.value.trim()) {
                        rutError.textContent = 'Por favor, ingrese su correo electrónico';
                        return;
                    }
                    if (!validarEmail(emailInput.value.trim())) {
                        rutError.textContent = 'Por favor, ingrese un correo electrónico válido';
                        return;
                    }
                }
                
                if (!validarRut(rutValue)) {
                    rutError.textContent = 'RUT del autor inválido';
                } else {
                    rutError.textContent = '';
                    if (validator.buttonId === 'validate-rut-inicial') {
                        // Guardar datos de validación inicial
                        validacionInicialData.rut = rutValue;
                        const tipoUsuarioElement = document.querySelector('input[name="tipo-usuario-inicial"]:checked');
                        const emailElement = document.getElementById('email-validacion-inicial');
                        
                        if (tipoUsuarioElement) {
                            validacionInicialData.tipoUsuario = tipoUsuarioElement.value;
                        }
                        if (emailElement) {
                            validacionInicialData.emailValidacion = emailElement.value;
                        }
                        
                        // Para la validación inicial, ir al home (inicio)
                        navigateToStepGlobal('inicio');
                    } else if (form) {
                        form.classList.remove('hidden');
                    }
                }
            });
        }
    });

    // Handlers para checkboxes de actualización de datos
    const updateFieldsHandlers = [
        { checkboxName: 'update-fields', fields: ['nombre', 'seudonimo', 'genero'] },
        { checkboxName: 'update-fields-contacto', fields: ['direccion', 'email', 'telefono'] }
    ];

    updateFieldsHandlers.forEach(handler => {
        const checkboxes = document.querySelectorAll(`input[name="${handler.checkboxName}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const fieldName = this.value;
                const fieldContainer = document.getElementById(`${fieldName}-field`);
                
                if (fieldContainer) {
                    if (this.checked) {
                        fieldContainer.classList.remove('hidden');
                    } else {
                        fieldContainer.classList.add('hidden');
                    }
                }
            });
        });
    });

    // Handler para tipo de afiliación
    const tipoAfiliacionRadios = document.querySelectorAll('input[name="tipo-afiliacion"]');
    tipoAfiliacionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const nombreObraContainer = document.getElementById('nombre-obra-container');
            if (nombreObraContainer) {
                if (this.value === 'con-obra') {
                    nombreObraContainer.classList.remove('hidden');
                } else {
                    nombreObraContainer.classList.add('hidden');
                }
            }
        });
    });

    // Handler para tipo de banco
    const tipoBancoSelect = document.getElementById('tipo-banco');
    if (tipoBancoSelect) {
        tipoBancoSelect.addEventListener('change', function() {
            const tipoCuentaField = document.getElementById('tipo-cuenta-field');
            const paisField = document.getElementById('pais-field');
            const direccionBancoField = document.getElementById('direccion-banco-field');
            const swiftIbanField = document.getElementById('swift-iban-field');
            
            if (this.value === 'nacional') {
                if (tipoCuentaField) tipoCuentaField.classList.remove('hidden');
                if (paisField) paisField.classList.add('hidden');
                if (direccionBancoField) direccionBancoField.classList.add('hidden');
                if (swiftIbanField) swiftIbanField.classList.add('hidden');
            } else if (this.value === 'extranjero') {
                if (tipoCuentaField) tipoCuentaField.classList.add('hidden');
                if (paisField) paisField.classList.remove('hidden');
                if (direccionBancoField) direccionBancoField.classList.remove('hidden');
                if (swiftIbanField) swiftIbanField.classList.remove('hidden');
                cargarPaises();
            }
        });
    }

    // Funciones para la gestión de exhibiciones
    function validarFormatoFecha(fecha) {
        const regex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/;
        return regex.test(fecha);
    }

    function renderizarTablaExhibiciones() {
        const exhibicionesBody = document.getElementById('exhibiciones-body');
        if (!exhibicionesBody) return;
        
        exhibicionesBody.innerHTML = '';
        
        if (exhibicionesData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No hay exhibiciones registradas</td>`;
            exhibicionesBody.appendChild(row);
            return;
        }
        
        exhibicionesData.forEach((exhibicion, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exhibicion.ambito}</td>
                <td>${exhibicion.obra}</td>
                <td>${exhibicion.pais}</td>
                <td>${exhibicion.fecha}</td>
                <td class="action-buttons">
                    <button type="button" class="action-button edit-button" data-index="${index}">Editar</button>
                    <button type="button" class="action-button delete-button" data-index="${index}">Eliminar</button>
                </td>
            `;
            exhibicionesBody.appendChild(row);
        });
        
        // Agregar event listeners a los botones de acción
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editarExhibicion(index);
            });
        });
        
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                eliminarExhibicion(index);
            });
        });
    }

    function mostrarFormularioExhibicion() {
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.remove('hidden');
            document.getElementById('exhibicion-ambito').value = '';
            document.getElementById('exhibicion-obra').value = '';
            document.getElementById('exhibicion-pais').value = '';
            document.getElementById('exhibicion-fecha').value = '';
            editingIndex = -1;
        }
    }

    function ocultarFormularioExhibicion() {
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.add('hidden');
        }
    }

    function guardarExhibicion() {
        const ambito = document.getElementById('exhibicion-ambito').value;
        const obra = document.getElementById('exhibicion-obra').value;
        const pais = document.getElementById('exhibicion-pais').value;
        const fecha = document.getElementById('exhibicion-fecha').value;
        
        if (!ambito || !obra || !pais || !fecha) {
            alert('Por favor, complete todos los campos');
            return;
        }
        
        if (!validarFormatoFecha(fecha)) {
            alert('Por favor, ingrese la fecha en formato dd-mm-yyyy');
            return;
        }
        
        const exhibicion = { ambito, obra, pais, fecha };
        
        if (editingIndex === -1) {
            exhibicionesData.push(exhibicion);
        } else {
            exhibicionesData[editingIndex] = exhibicion;
        }
        
        renderizarTablaExhibiciones();
        ocultarFormularioExhibicion();
    }

    function editarExhibicion(index) {
        const exhibicion = exhibicionesData[index];
        
        document.getElementById('exhibicion-ambito').value = exhibicion.ambito;
        document.getElementById('exhibicion-obra').value = exhibicion.obra;
        document.getElementById('exhibicion-pais').value = exhibicion.pais;
        document.getElementById('exhibicion-fecha').value = exhibicion.fecha;
        
        editingIndex = index;
        const exhibicionForm = document.getElementById('exhibicion-form');
        if (exhibicionForm) {
            exhibicionForm.classList.remove('hidden');
        }
    }

    function eliminarExhibicion(index) {
        if (confirm('¿Está seguro de que desea eliminar esta exhibición?')) {
            exhibicionesData.splice(index, 1);
            renderizarTablaExhibiciones();
        }
    }

    // Event listeners para exhibiciones
    const addExhibicionBtn = document.getElementById('add-exhibicion');
    if (addExhibicionBtn) {
        addExhibicionBtn.addEventListener('click', mostrarFormularioExhibicion);
    }

    const saveExhibicionBtn = document.getElementById('save-exhibicion');
    if (saveExhibicionBtn) {
        saveExhibicionBtn.addEventListener('click', guardarExhibicion);
    }

    const cancelExhibicionBtn = document.getElementById('cancel-exhibicion');
    if (cancelExhibicionBtn) {
        cancelExhibicionBtn.addEventListener('click', ocultarFormularioExhibicion);
    }

    // Inicializar la tabla de exhibiciones
    renderizarTablaExhibiciones();  


    // Función para determinar el tipo de solicitud y enviar datos
    function enviarDatos(formData) {
        let tipoSolicitud = 'actualizacion-datos-personales';
        
        if (formData.campos) {
            if (formData.campos.hasOwnProperty('direccion') || formData.campos.hasOwnProperty('email') || formData.campos.hasOwnProperty('telefono')) {
                tipoSolicitud = 'actualizacion-datos-contacto';
            } else if (formData.campos.hasOwnProperty('tipo-banco')) {
                tipoSolicitud = 'actualizacion-datos-bancarios';
            }
        }
        
        // Validar que los campos requeridos no estén vacíos
        if (!formData.rut || formData.rut.trim() === '') {
            alert('Error: No se pudo obtener el RUT del autor de validación. Por favor, recargue la página e intente nuevamente.');
            return;
        }
        
        if (!formData.tipoUsuario || formData.tipoUsuario.trim() === '') {
            alert('Error: No se pudo obtener el tipo de usuario. Por favor, recargue la página e intente nuevamente.');
            return;
        }
        
        if (!formData.emailValidacion || formData.emailValidacion.trim() === '') {
            alert('Error: No se pudo obtener el email de validación. Por favor, recargue la página e intente nuevamente.');
            return;
        }
        
        enviarDatosAPowerAutomate(formData, tipoSolicitud);
    }

    // Función para resetear el breadcrumb al inicio
    function resetBreadcrumbToStart() {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (breadcrumbContainer) {
            breadcrumbContainer.innerHTML = '';
            
            const inicioItem = document.createElement('li');
            inicioItem.classList.add('breadcrumb-item', 'active');
            inicioItem.setAttribute('data-step', 'inicio');
            inicioItem.textContent = 'Inicio';
            breadcrumbContainer.appendChild(inicioItem);
            
            addBreadcrumbListeners();
        }
    }

    // Función para resetear el formulario
    function resetForm() {
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        exhibicionesData = [];
        renderizarTablaExhibiciones();
        
        document.querySelectorAll('.form-container, #update-options, #update-options-contacto, #update-options-bancarios').forEach(container => {
            container.classList.add('hidden');
        });
        
        document.querySelectorAll('.field-container').forEach(field => {
            field.classList.add('hidden');
        });
        
        // Resetear el breadcrumb al inicio
        resetBreadcrumbToStart();
    }

    // Asignar función resetForm a variable global
    resetFormGlobal = resetForm;

    // Handlers de envío para todos los formularios
    
    // Datos personales
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const selectedFields = document.querySelectorAll('input[name="update-fields"]:checked');
            
            if (selectedFields.length === 0) {
                alert('Por favor, seleccione al menos un campo para actualizar.');
                return;
            }
            
            // Verificar si "Nombre" está seleccionado
            const nombreSelected = document.getElementById('update-nombre').checked;
            
            // Validar campo "Detalle de la solicitud" solo si "Nombre" está seleccionado
            if (nombreSelected) {
                const observacionesField = document.getElementById('observaciones');
                if (!observacionesField.value.trim()) {
                    alert('Por favor, complete el campo "Detalle de la solicitud" cuando seleccione actualizar el nombre.');
                    observacionesField.focus();
                    return;
                }
            }
            
            let isValid = true;
            
            let formData = {
                rut: validacionInicialData.rut || '',
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                campos: {},
                observaciones: document.getElementById('observaciones') ? document.getElementById('observaciones').value : ''
            };
            
            selectedFields.forEach(field => {
                const fieldName = field.value;
                const fieldValue = document.getElementById(fieldName).value;
                
                if (!fieldValue) {
                    isValid = false;
                    alert(`Por favor, complete el campo ${fieldName}.`);
                    return;
                }
                
                formData.campos[fieldName] = fieldValue;
            });
            
            if (!isValid) return;
            
            enviarDatos(formData);
        });
    }

    // Datos de contacto
    const submitButtonContacto = document.getElementById('submit-button-contacto');
    if (submitButtonContacto) {
        submitButtonContacto.addEventListener('click', function() {
            const selectedFields = document.querySelectorAll('input[name="update-fields-contacto"]:checked');
            
            if (selectedFields.length === 0) {
                alert('Por favor, seleccione al menos un campo para actualizar.');
                return;
            }
            
            let isValid = true;
            let formData = {
                rut: validacionInicialData.rut || '',
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                campos: {},
                observaciones: document.getElementById('observaciones-contacto') ? document.getElementById('observaciones-contacto').value : ''
            };
            
            selectedFields.forEach(field => {
                const fieldName = field.value;
                const fieldValue = document.getElementById(fieldName).value;
                
                if (!fieldValue) {
                    isValid = false;
                    alert(`Por favor, complete el campo ${fieldName}.`);
                    return;
                }
                
                if (fieldName === 'email' && !validarEmail(fieldValue)) {
                    isValid = false;
                    alert('Por favor, ingrese un correo electrónico válido.');
                    return;
                }
                
                formData.campos[fieldName] = fieldValue;
            });
            
            if (!isValid) return;
            
            enviarDatos(formData);
        });
    }

    // Datos bancarios
    const submitButtonBancarios = document.getElementById('submit-button-bancarios');
    if (submitButtonBancarios) {
        submitButtonBancarios.addEventListener('click', function() {
            const tipoBanco = document.getElementById('tipo-banco').value;
            const banco = document.getElementById('banco').value;
            const numeroCuenta = document.getElementById('numero-cuenta').value;
            
            if (!tipoBanco || !banco || !numeroCuenta) {
                alert('Por favor, complete todos los campos obligatorios.');
                return;
            }
            
            let isValid = true;
            let formData = {
                rut: validacionInicialData.rut || '',
                tipoUsuario: validacionInicialData.tipoUsuario || '',
                emailValidacion: validacionInicialData.emailValidacion || '',
                campos: {
                    'tipo-banco': tipoBanco,
                    'banco': banco,
                    'numero-cuenta': numeroCuenta
                },
                observaciones: document.getElementById('observaciones-bancarios') ? document.getElementById('observaciones-bancarios').value : ''
            };
            
            if (tipoBanco === 'nacional') {
                const tipoCuenta = document.getElementById('tipo-cuenta').value;
                if (!tipoCuenta) {
                    isValid = false;
                    alert('Por favor, seleccione un tipo de cuenta.');
                    return;
                }
                formData.campos['tipo-cuenta'] = tipoCuenta;
            } else if (tipoBanco === 'extranjero') {
                const pais = document.getElementById('pais').value;
                const direccionBanco = document.getElementById('direccion-banco').value;
                const swiftIban = document.getElementById('swift-iban').value;
                
                if (!pais || !direccionBanco || !swiftIban) {
                    isValid = false;
                    alert('Por favor, complete todos los campos para banco extranjero.');
                    return;
                }
                
                formData.campos['pais'] = pais;
                formData.campos['direccion-banco'] = direccionBanco;
                formData.campos['swift-iban'] = swiftIban;
            }
            
            if (!isValid) return;
            
            enviarDatos(formData);
        });
    }

    // Exhibición de obra
    const submitButtonExhibicion = document.getElementById('submit-button-exhibicion');
    if (submitButtonExhibicion) {
        submitButtonExhibicion.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-exhibicion');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (exhibicionesData.length === 0) {
                alert('Por favor, agregue al menos una exhibición antes de enviar la solicitud.');
                return;
            }
            
            const datos = {
                rut: rutInput.value.trim(),
                tipoUsuario: document.querySelector('input[name="tipo-usuario-exhibicion"]:checked')?.value || '',
                emailValidacion: document.getElementById('email-validacion-exhibicion').value,
                exhibiciones: exhibicionesData
            };
            
            enviarDatosAPowerAutomate(datos, 'exhibicion-obra-extranjero');
        });
    }

    // Conflicto en obra
    const submitButtonConflicto = document.getElementById('submit-button-conflicto');
    if (submitButtonConflicto) {
        submitButtonConflicto.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-conflicto');
            const obraInput = document.getElementById('conflicto-obra');
            const descripcionInput = document.getElementById('conflicto-descripcion');
            const ambitoRadio = document.querySelector('input[name="conflicto-ambito"]:checked');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (!obraInput || !obraInput.value.trim()) {
                alert('Por favor, ingrese el nombre de la obra en conflicto.');
                return;
            }
            
            if (!descripcionInput || !descripcionInput.value.trim()) {
                alert('Por favor, describa el conflicto.');
                return;
            }
            
            if (!ambitoRadio) {
                alert('Por favor, seleccione un ámbito.');
                return;
            }
            
            const datos = {
                rut: rutInput.value.trim(),
                tipoUsuario: document.querySelector('input[name="tipo-usuario-conflicto"]:checked')?.value || '',
                emailValidacion: document.getElementById('email-validacion-conflicto').value,
                ambito: ambitoRadio.value,
                obra: obraInput.value.trim(),
                descripcion: descripcionInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'conflicto-obra');
        });
    }

    // Certificado de afiliación
    const submitButtonAfiliacion = document.getElementById('submit-button-afiliacion');
    if (submitButtonAfiliacion) {
        submitButtonAfiliacion.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-afiliacion');
            const motivoInput = document.getElementById('afiliacion-motivo');
            const tipoAfiliacion = document.querySelector('input[name="tipo-afiliacion"]:checked');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (!tipoAfiliacion) {
                alert('Por favor, seleccione un tipo de afiliación.');
                return;
            }
            
            const datos = {
                rut: rutInput.value.trim(),
                tipoAfiliacion: tipoAfiliacion.value,
                motivo: motivoInput.value.trim()
            };
            
            if (tipoAfiliacion.value === 'con-obra') {
                const nombreObraInput = document.getElementById('nombre-obra');
                if (nombreObraInput && nombreObraInput.value.trim()) {
                    datos.nombreObra = nombreObraInput.value.trim();
                }
            }
            
            enviarDatosAPowerAutomate(datos, 'certificado-afiliacion');
        });
    }

    // Certificado de derechos recibidos
    const submitButtonDerechos = document.getElementById('submit-button-derechos');
    if (submitButtonDerechos) {
        submitButtonDerechos.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-derechos');
            const fechaInicioInput = document.getElementById('derechos-fecha-inicio');
            const fechaFinInput = document.getElementById('derechos-fecha-fin');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (!fechaInicioInput || !fechaInicioInput.value.trim()) {
                alert('Por favor, ingrese la fecha de inicio.');
                return;
            }
            
            if (!fechaFinInput || !fechaFinInput.value.trim()) {
                alert('Por favor, ingrese la fecha de fin.');
                return;
            }
            
            const datos = {
                rut: rutInput.value.trim(),
                fechaInicio: fechaInicioInput.value.trim(),
                fechaFin: fechaFinInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'certificado-derechos-recibidos');
        });
    }

    // Desafiliación
    const submitButtonDesafiliacion = document.getElementById('submit-button-desafiliacion');
    if (submitButtonDesafiliacion) {
        submitButtonDesafiliacion.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-desafiliacion');
            const motivoInput = document.getElementById('desafiliacion-motivo');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            const datos = {
                rut: rutInput.value.trim(),
                motivo: motivoInput.value.trim()
            };
            
            enviarDatosAPowerAutomate(datos, 'desafiliacion');
        });
    }

});  // Fin del DOMContentLoaded    
// Funcionalidad específica para Ámbito o Clase
    function initAmbitoClaseSection() {
        const ambitoAudiovisual = document.getElementById('ambito-audiovisual');
        const ambitoDramatico = document.getElementById('ambito-dramatico');
        const claseAudiovisualOptions = document.querySelectorAll('.clase-audiovisual');
        const claseDramaticoOptions = document.querySelectorAll('.clase-dramatico');
        const noClaseMessage = document.getElementById('no-clase-message');

        // Función para mostrar/ocultar opciones de clase según el ámbito seleccionado
        function toggleClaseOptions() {
            let hasAnyAmbitoSelected = false;

            // Mostrar/ocultar opciones de Audiovisual
            if (ambitoAudiovisual && ambitoAudiovisual.checked) {
                hasAnyAmbitoSelected = true;
                claseAudiovisualOptions.forEach((option, index) => {
                    setTimeout(() => {
                        option.classList.remove('hidden');
                        option.classList.add('show');
                    }, index * 100);
                });
            } else {
                claseAudiovisualOptions.forEach(option => {
                    option.classList.add('hidden');
                    option.classList.remove('show');
                    // Desmarcar checkboxes cuando se ocultan
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) checkbox.checked = false;
                });
            }

            // Mostrar/ocultar opciones de Dramático
            if (ambitoDramatico && ambitoDramatico.checked) {
                hasAnyAmbitoSelected = true;
                claseDramaticoOptions.forEach((option, index) => {
                    setTimeout(() => {
                        option.classList.remove('hidden');
                        option.classList.add('show');
                    }, index * 100);
                });
            } else {
                claseDramaticoOptions.forEach(option => {
                    option.classList.add('hidden');
                    option.classList.remove('show');
                    // Desmarcar checkboxes cuando se ocultan
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) checkbox.checked = false;
                });
            }

            // Mostrar/ocultar mensaje informativo
            if (noClaseMessage) {
                if (hasAnyAmbitoSelected) {
                    noClaseMessage.classList.add('hidden');
                } else {
                    noClaseMessage.classList.remove('hidden');
                }
            }
        }

        // Agregar event listeners a los checkboxes de ámbito
        if (ambitoAudiovisual) {
            ambitoAudiovisual.addEventListener('change', toggleClaseOptions);
        }

        if (ambitoDramatico) {
            ambitoDramatico.addEventListener('change', toggleClaseOptions);
        }

        // Inicializar el estado
        toggleClaseOptions();
    }

    // Validador de RUT para ámbito
    const validateRutAmbitoButton = document.getElementById('validate-rut-ambito');
    if (validateRutAmbitoButton) {
        validateRutAmbitoButton.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-ambito');
            const rutError = document.getElementById('rut-ambito-error');
            const form = document.getElementById('ambito-clase-form');
            
            if (!rutInput || !rutError) return;
            
            const rutValue = rutInput.value.trim();
            
            if (!rutValue) {
                rutError.textContent = 'Por favor, ingrese un RUT del autor';
                return;
            }
            
            if (!validarRut(rutValue)) {
                rutError.textContent = 'RUT del autor inválido';
            } else {
                rutError.textContent = '';
                if (form) {
                    form.classList.remove('hidden');
                    // Inicializar la funcionalidad después de mostrar el formulario
                    setTimeout(initAmbitoClaseSection, 100);
                }
            }
        });
    }

    // Handler de envío para ámbito y clase
    const submitButtonAmbito = document.getElementById('submit-button-ambito');
    if (submitButtonAmbito) {
        submitButtonAmbito.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-ambito');
            const ambitoCheckboxes = document.querySelectorAll('input[name="ambito"]:checked');
            const claseCheckboxes = document.querySelectorAll('input[name="clase"]:checked');
            const observacionesInput = document.getElementById('observaciones-ambito');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (ambitoCheckboxes.length === 0) {
                alert('Por favor, seleccione al menos un ámbito.');
                return;
            }
            
            if (claseCheckboxes.length === 0) {
                alert('Por favor, seleccione al menos una clase.');
                return;
            }
            
            // Validar observaciones obligatorias
            
            // Preparar datos para enviar
            const ambitos = Array.from(ambitoCheckboxes).map(cb => cb.value);
            const clases = Array.from(claseCheckboxes).map(cb => cb.value);
            
            const datos = {
                rut: rutInput.value.trim(),
                tipoUsuario: document.querySelector('input[name="tipo-usuario-ambito"]:checked')?.value || '',
                emailValidacion: document.getElementById('email-validacion-ambito').value,
                campos: {
                    ambitos: ambitos,
                    clases: clases
                },
                observaciones: observacionesInput ? observacionesInput.value.trim() : ''
            };
            
            enviarDatosAPowerAutomate(datos, 'actualizacion-datos-autor-ambito');
        });
    }

    // Inicializar la sección si ya está visible
    if (document.getElementById('ambito-clase-form') && !document.getElementById('ambito-clase-form').classList.contains('hidden')) {
        initAmbitoClaseSection();
    } 
   // Funcionalidad para la gestión de sociedades
    let sociedadesData = [];
    let editingSociedadIndex = -1;

    function cargarSociedades() {
        const rutaAbsoluta = window.location.origin + '/assets/sociedades.json';
        
        fetch(rutaAbsoluta, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const sociedadSelect = document.getElementById('sociedad-nombre');
            
            if (!sociedadSelect) return;
            
            // Limpiar opciones existentes excepto la primera
            while (sociedadSelect.options.length > 1) {
                sociedadSelect.remove(1);
            }
            
            // Agregar cada sociedad como una opción
            data.forEach(sociedad => {
                const option = document.createElement('option');
                option.value = sociedad.nombre;
                option.textContent = sociedad.nombre;
                sociedadSelect.appendChild(option);
            });
            
            console.log('Sociedades cargadas correctamente:', data.length);
        })
        .catch(error => {
            console.error('Error al cargar las sociedades:', error);
        });
    }

    function renderizarTablaSociedades() {
        const sociedadesBody = document.getElementById('sociedades-body');
        if (!sociedadesBody) return;
        
        sociedadesBody.innerHTML = '';
        
        if (sociedadesData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="5" style="text-align: center;">No hay sociedades registradas</td>`;
            sociedadesBody.appendChild(row);
            return;
        }
        
        sociedadesData.forEach((sociedad, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sociedad.sociedad}</td>
                <td>${sociedad.pais}</td>
                <td>${sociedad.ambito}</td>
                <td>${sociedad.clase}</td>
                <td class="action-buttons">
                    <button type="button" class="action-button edit-button" data-index="${index}">Editar</button>
                    <button type="button" class="action-button delete-button" data-index="${index}">Eliminar</button>
                </td>
            `;
            sociedadesBody.appendChild(row);
        });
        
        // Agregar event listeners a los botones de acción
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editarSociedad(index);
            });
        });
        
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                eliminarSociedad(index);
            });
        });
    }

    function mostrarFormularioSociedad() {
        const sociedadForm = document.getElementById('sociedad-form');
        if (sociedadForm) {
            sociedadForm.classList.remove('hidden');
            // Limpiar el formulario
            document.getElementById('sociedad-nombre').value = '';
            document.getElementById('otra-sociedad-nombre').value = '';
            document.getElementById('sociedad-pais').value = '';
            document.getElementById('sociedad-ambito').value = '';
            document.getElementById('sociedad-clase').value = '';
            
            // Ocultar campo "otra sociedad"
            document.getElementById('otra-sociedad-field').classList.add('hidden');
            
            editingSociedadIndex = -1;
        }
    }

    function ocultarFormularioSociedad() {
        const sociedadForm = document.getElementById('sociedad-form');
        if (sociedadForm) {
            sociedadForm.classList.add('hidden');
        }
    }

    function actualizarClasesSociedad() {
        const ambitoSelect = document.getElementById('sociedad-ambito');
        const claseSelect = document.getElementById('sociedad-clase');
        
        if (!ambitoSelect || !claseSelect) return;
        
        const ambito = ambitoSelect.value;
        
        // Limpiar opciones de clase
        claseSelect.innerHTML = '<option value="">Seleccione una clase</option>';
        
        if (ambito === 'Audiovisual') {
            const clases = ['Director', 'Guionista'];
            clases.forEach(clase => {
                const option = document.createElement('option');
                option.value = clase;
                option.textContent = clase;
                claseSelect.appendChild(option);
            });
        } else if (ambito === 'Dramático') {
            const clases = ['Dramaturgo', 'Coreógrafo', 'Compositor', 'Traductor'];
            clases.forEach(clase => {
                const option = document.createElement('option');
                option.value = clase;
                option.textContent = clase;
                claseSelect.appendChild(option);
            });
        }
    }

    function guardarSociedad() {
        const sociedadNombre = document.getElementById('sociedad-nombre').value;
        const otraSociedad = document.getElementById('otra-sociedad-nombre').value;
        const pais = document.getElementById('sociedad-pais').value;
        const ambito = document.getElementById('sociedad-ambito').value;
        const clase = document.getElementById('sociedad-clase').value;
        
        // Validar campos
        if (!sociedadNombre || !pais || !ambito || !clase) {
            alert('Por favor, complete todos los campos');
            return;
        }
        
        // Si seleccionó "Otra", validar que haya especificado el nombre
        if (sociedadNombre === 'Otra' && !otraSociedad.trim()) {
            alert('Por favor, especifique el nombre de la sociedad');
            return;
        }
        
        const sociedad = {
            sociedad: sociedadNombre === 'Otra' ? otraSociedad.trim() : sociedadNombre,
            pais,
            ambito,
            clase
        };
        
        if (editingSociedadIndex === -1) {
            // Agregar nueva sociedad
            sociedadesData.push(sociedad);
        } else {
            // Actualizar sociedad existente
            sociedadesData[editingSociedadIndex] = sociedad;
        }
        
        renderizarTablaSociedades();
        ocultarFormularioSociedad();
    }

    function editarSociedad(index) {
        const sociedad = sociedadesData[index];
        
        document.getElementById('sociedad-nombre').value = sociedad.sociedad;
        document.getElementById('sociedad-pais').value = sociedad.pais;
        document.getElementById('sociedad-ambito').value = sociedad.ambito;
        
        // Actualizar clases según el ámbito
        actualizarClasesSociedad();
        
        // Establecer la clase después de actualizar las opciones
        setTimeout(() => {
            document.getElementById('sociedad-clase').value = sociedad.clase;
        }, 100);
        
        editingSociedadIndex = index;
        const sociedadForm = document.getElementById('sociedad-form');
        if (sociedadForm) {
            sociedadForm.classList.remove('hidden');
        }
    }

    function eliminarSociedad(index) {
        if (confirm('¿Está seguro de que desea eliminar esta sociedad?')) {
            sociedadesData.splice(index, 1);
            renderizarTablaSociedades();
        }
    }

    // Event listeners para sociedades
    const addSociedadBtn = document.getElementById('add-sociedad');
    if (addSociedadBtn) {
        addSociedadBtn.addEventListener('click', mostrarFormularioSociedad);
    }

    const saveSociedadBtn = document.getElementById('save-sociedad');
    if (saveSociedadBtn) {
        saveSociedadBtn.addEventListener('click', guardarSociedad);
    }

    const cancelSociedadBtn = document.getElementById('cancel-sociedad');
    if (cancelSociedadBtn) {
        cancelSociedadBtn.addEventListener('click', ocultarFormularioSociedad);
    }

    // Event listener para cambio de ámbito
    const sociedadAmbitoSelect = document.getElementById('sociedad-ambito');
    if (sociedadAmbitoSelect) {
        sociedadAmbitoSelect.addEventListener('change', actualizarClasesSociedad);
    }

    // Event listener para cambio de sociedad (mostrar/ocultar campo "otra")
    const sociedadNombreSelect = document.getElementById('sociedad-nombre');
    if (sociedadNombreSelect) {
        sociedadNombreSelect.addEventListener('change', function() {
            const otraSociedadField = document.getElementById('otra-sociedad-field');
            if (this.value === 'Otra') {
                otraSociedadField.classList.remove('hidden');
            } else {
                otraSociedadField.classList.add('hidden');
            }
        });
    }

    // Validador de RUT para sociedades
    const validateRutSociedadesButton = document.getElementById('validate-rut-sociedades');
    if (validateRutSociedadesButton) {
        validateRutSociedadesButton.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-sociedades');
            const rutError = document.getElementById('rut-sociedades-error');
            const form = document.getElementById('sociedades-container');
            
            if (!rutInput || !rutError) return;
            
            const rutValue = rutInput.value.trim();
            
            if (!rutValue) {
                rutError.textContent = 'Por favor, ingrese un RUT del autor';
                return;
            }
            
            if (!validarRut(rutValue)) {
                rutError.textContent = 'RUT del autor inválido';
            } else {
                rutError.textContent = '';
                if (form) {
                    form.classList.remove('hidden');
                    // Cargar datos después de mostrar el formulario
                    cargarSociedades();
                    renderizarTablaSociedades();
                }
            }
        });
    }

    // Handler de envío para sociedades
    const submitButtonSociedades = document.getElementById('submit-button-sociedades');
    if (submitButtonSociedades) {
        submitButtonSociedades.addEventListener('click', function() {
            const rutInput = document.getElementById('rut-sociedades');
            const observacionesInput = document.getElementById('observaciones-sociedades');
            
            if (!rutInput || !rutInput.value.trim()) {
                alert('Por favor, valide su RUT antes de enviar la solicitud.');
                return;
            }
            
            if (sociedadesData.length === 0) {
                alert('Por favor, agregue al menos una sociedad antes de enviar la solicitud.');
                return;
            }
            
            // Validar observaciones obligatorias
            
            const datos = {
                rut: rutInput.value.trim(),
                tipoUsuario: document.querySelector('input[name="tipo-usuario-sociedades"]:checked')?.value || '',
                emailValidacion: document.getElementById('email-validacion-sociedades').value,
                sociedades: sociedadesData,
                observaciones: observacionesInput ? observacionesInput.value.trim() : ''
            };
            
            enviarDatosAPowerAutomate(datos, 'actualizacion-datos-autor-sociedades');
        });
    }
