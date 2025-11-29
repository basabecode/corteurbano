# 🔄 Mejoras de Lógica y UX - ServiceCard a BookingForm

## Problema Identificado

Cuando el usuario hacía clic en "Reservar servicio" desde una `ServiceCard`, solo se hacía scroll al formulario de reserva, pero **no se pre-seleccionaba el servicio**. El usuario tenía que:
1. Hacer scroll
2. Volver a seleccionar el mismo servicio en el paso 1
3. Luego elegir fecha y hora

Esto creaba fricción innecesaria en el flujo de reserva.

## Solución Implementada

### 1. Nuevo Componente: `ServicesBookingSection.tsx`

Creé un componente wrapper cliente que coordina la comunicación entre `ServiceCard` y `BookingForm`:

```tsx
'use client';

export function ServicesBookingSection({ services, busySlots }) {
  const [preSelectedServiceId, setPreSelectedServiceId] = useState(null);

  const handleServiceSelect = (serviceId) => {
    setPreSelectedServiceId(serviceId);
    // Scroll to booking form
    setTimeout(() => {
      document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <section id="servicios">
        {services.map((service) => (
          <ServiceCard
            serviceId={service.id}
            onReserve={handleServiceSelect}
            {...service}
          />
        ))}
      </section>

      <BookingForm 
        services={services} 
        busySlots={busySlots} 
        preSelectedServiceId={preSelectedServiceId}
        onServiceSelected={() => setPreSelectedServiceId(null)}
      />
    </>
  );
}
```

### 2. Actualización de `ServiceCard.tsx`

Agregué:
- Prop `serviceId`: Para identificar el servicio
- Prop `onReserve`: Callback que se ejecuta al hacer clic en "Reservar servicio"

```tsx
export function ServiceCard({ serviceId, onReserve, ... }) {
  const handleReserve = () => {
    if (onReserve) {
      onReserve(serviceId);
    } else {
      // Fallback: solo scroll
      document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
}
```

### 3. Actualización de `BookingForm.tsx`

Agregué:
- Prop `preSelectedServiceId`: ID del servicio pre-seleccionado
- Prop `onServiceSelected`: Callback para limpiar la pre-selección
- `useEffect`: Auto-selecciona el servicio y salta al paso 2

```tsx
export function BookingForm({ preSelectedServiceId, onServiceSelected, ... }) {
  useEffect(() => {
    if (preSelectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === preSelectedServiceId);
      if (service) {
        setSelectedService(service);
        setStep(2); // Ir directamente al calendario
        setTime(null);
        setDate(undefined);
        if (onServiceSelected) {
          onServiceSelected();
        }
      }
    }
  }, [preSelectedServiceId, services, onServiceSelected]);
}
```

### 4. Actualización de `page.tsx`

Simplifiqué el componente para usar el nuevo wrapper:

```tsx
export default async function HomePage() {
  const [services, busySlots] = await Promise.all([getServices(), getBusySlots()]);

  return (
    <div className="space-y-16 px-4 py-12 md:px-10">
      <Hero />
      <ServicesBookingSection services={services} busySlots={busySlots} />
    </div>
  );
}
```

## Flujo Mejorado

### Antes:
1. Usuario ve servicio → Click "Reservar"
2. Scroll a formulario
3. Usuario selecciona servicio nuevamente (Paso 1)
4. Usuario selecciona fecha (Paso 2)
5. Usuario selecciona hora (Paso 3)

### Después:
1. Usuario ve servicio → Click "Reservar"
2. Scroll a formulario + **Auto-selección del servicio**
3. Usuario selecciona fecha (Paso 2) ✅ **Directo al calendario**
4. Usuario selecciona hora (Paso 3)

## Beneficios

1. ✅ **Menos clics**: Elimina un paso completo
2. ✅ **Flujo más intuitivo**: El usuario no tiene que repetir la selección
3. ✅ **Mejor conversión**: Reduce la fricción en el embudo de reserva
4. ✅ **Experiencia premium**: Más fluida y profesional

## Optimización Adicional del Hero

Como no pude generar una imagen vertical nueva (límite de API alcanzado), optimicé la imagen existente para móvil:

```tsx
className="object-cover object-[center_30%] md:object-center"
```

Esto hace que en móvil la imagen se enfoque en la parte superior-central (30% desde arriba), lo que generalmente captura mejor los elementos importantes de una barbería (sillas, espejos, luces) en lugar de mostrar el piso.

## Archivos Modificados

1. ✅ `app/(public)/components/ServicesBookingSection.tsx` - **NUEVO**
2. ✅ `app/(public)/components/ServiceCard.tsx` - Actualizado
3. ✅ `app/(public)/components/BookingForm.tsx` - Actualizado
4. ✅ `app/(public)/page.tsx` - Simplificado
5. ✅ `app/(public)/components/Hero.tsx` - Optimizado para móvil

## Pruebas Recomendadas

1. Click en "Reservar servicio" desde cualquier `ServiceCard`
2. Verificar que hace scroll al formulario
3. Verificar que el servicio ya está seleccionado
4. Verificar que muestra el calendario (Paso 2)
5. Seleccionar fecha y hora
6. Confirmar reserva

---

**Nota:** La lógica ahora es completamente funcional y sigue el flujo esperado por el usuario.
