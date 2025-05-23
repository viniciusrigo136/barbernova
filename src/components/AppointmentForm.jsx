import React, { useState, useEffect, useMemo } from 'react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { motion } from 'framer-motion';
    import { servicesList } from './ServicesSection';
    import FormField from './appointment-form/FormField';
    import ServiceSelector from './appointment-form/ServiceSelector';
    import DateTimeSelector from './appointment-form/DateTimeSelector';
    import { generateTimeSlots, getAvailableTimeSlotsForDate, validateDateSelection } from './appointment-form/timeSlotUtils';

    const allTimeSlotsByDay = {
        1: generateTimeSlots([{ start: 13, end: 20 }]), // Monday
        2: generateTimeSlots([{ start: 8, end: 11.5 }, { start: 13, end: 20 }]), // Tuesday
    };
    
    const AppointmentForm = () => {
      const { toast } = useToast();
      const [formData, setFormData] = useState({
        name: '',
        phone: '',
        services: [],
        date: '',
        time: '',
        totalValue: 0,
      });
      const [errors, setErrors] = useState({});
      const [bookedSlots, setBookedSlots] = useState([]);
      const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

      useEffect(() => {
        const calculateTotal = () => {
          const total = formData.services.reduce((sum, serviceId) => {
            const selectedService = servicesList.find(s => s.id === serviceId);
            return sum + (selectedService ? selectedService.price : 0);
          }, 0);
          setFormData(prev => ({ ...prev, totalValue: total }));
        };
        calculateTotal();
      }, [formData.services]);

      useEffect(() => {
        if (formData.date) {
            const selectedDate = new Date(formData.date + "T00:00:00");
            const dayOfWeek = selectedDate.getUTCDay(); // Sunday = 0, Monday = 1, etc.
            
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const slotsForDate = appointments
              .filter(app => app.date === formData.date)
              .map(app => app.time);
            setBookedSlots(slotsForDate);

            const slotsForDay = allTimeSlotsByDay[dayOfWeek] || [];
            setAvailableTimeSlots(slotsForDay.filter(slot => !slotsForDate.includes(slot)));

        } else {
          setBookedSlots([]);
          setAvailableTimeSlots([]);
        }
      }, [formData.date]);


      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
          setErrors(prev => ({...prev, [name]: null}));
        }
        if (name === 'date') {
          setFormData(prev => ({ ...prev, time: '' })); 
          const dateError = validateDateSelection(value);
          setErrors(prev => ({ ...prev, date: dateError }));
        }
      };

      const handleTimeChange = (value) => {
        setFormData((prev) => ({ ...prev, time: value }));
        if (errors.time) {
          setErrors(prev => ({...prev, time: null}));
        }
      };
      
      const handleServiceChange = (serviceId) => {
        setFormData((prev) => {
          const currentServices = prev.services;
          let updatedServices;
          if (currentServices.includes(serviceId)) {
            updatedServices = currentServices.filter(id => id !== serviceId);
          } else {
            updatedServices = [...currentServices, serviceId];
          }
          return { ...prev, services: updatedServices };
        });
        if (errors.services) {
          setErrors(prev => ({...prev, services: null}));
        }
      };

      const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Nome é obrigatório.";
        if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório.";
        else if (!/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = "Telefone inválido (use apenas números, ex: 49999999999).";
        if (formData.services.length === 0) newErrors.services = "Selecione ao menos um serviço.";
        
        const dateError = validateDateSelection(formData.date);
        if(dateError) newErrors.date = dateError;

        if (!formData.time) newErrors.time = "Hora é obrigatória.";
        else if (bookedSlots.includes(formData.time)) newErrors.time = "Este horário já está agendado.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
          toast({
            title: "Erro de Validação",
            description: "Por favor, corrija os campos destacados.",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }
        
        const appointmentData = {
          ...formData,
          services: formData.services.map(id => servicesList.find(s => s.id === id)?.title || id) 
        };

        const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        appointments.push(appointmentData);
        localStorage.setItem('appointments', JSON.stringify(appointments));

        toast({
          title: 'Agendamento Confirmado!',
          description: 'Seu horário foi agendado com sucesso!',
          variant: 'default',
          duration: 5000,
        });
        setFormData({ name: '', phone: '', services: [], date: '', time: '', totalValue: 0 });
        setErrors({});
        setBookedSlots([]); 
        setAvailableTimeSlots([]);
      };
      
      return (
        <section id="appointment-form" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Agende seu Horário
            </motion.h2>
            <motion.form 
              onSubmit={handleSubmit} 
              className="max-w-lg mx-auto space-y-6 bg-secondary p-8 rounded-lg shadow-xl border border-primary/20"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <FormField
                id="name"
                name="name"
                label="Nome"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Seu nome completo"
              />
              <FormField
                id="phone"
                name="phone"
                label="Telefone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="(XX) XXXXX-XXXX"
              />
              
              <ServiceSelector
                services={servicesList}
                selectedServices={formData.services}
                onServiceChange={handleServiceChange}
                error={errors.services}
              />

              {formData.totalValue > 0 && (
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold text-primary">
                    Valor Total: R$ {formData.totalValue.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              )}

              <DateTimeSelector
                date={formData.date}
                time={formData.time}
                onDateChange={handleChange}
                onTimeChange={handleTimeChange}
                dateError={errors.date}
                timeError={errors.time}
                availableTimeSlots={availableTimeSlots}
              />
             
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 transition-transform transform hover:scale-105 duration-300 ease-in-out">
                Confirmar Agendamento
              </Button>
            </motion.form>
          </div>
        </section>
      );
    };

    export default AppointmentForm;