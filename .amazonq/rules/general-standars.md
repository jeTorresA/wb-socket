# Estándares Generales de Código

- Debe implementar SOLID
- Debe implementar Event Driven Architecture
- Debe mantener compatibilidad backward
- Debe usar TypeScript tipado estricto
- Debe crear pruebas unitarias para nuevos servicios
- Debe documentar módulos creados
- Debe evitar duplicación de lógica
- Debe mantener namespaces obligatorios
- Debe respetar naming estándar de eventos
- Formato obligatorio eventos:
    ```
    recurso.accion
    ```

    Ejemplos:

    ```
    message.created
    message.read
    notification.new
    ```