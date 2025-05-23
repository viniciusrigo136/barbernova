import React, { useState, useEffect } from 'react';
    import { Button } from '@/components/ui/button';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Trash2, LogOut, MessageSquare } from 'lucide-react';
    import { motion } from 'framer-motion';
    import { Link, useNavigate } from 'react-router-dom';
    import { useToast } from "@/components/ui/use-toast";
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
    } from "@/components/ui/alert-dialog";

    const AdminDashboard = () => {
      const [appointments, setAppointments] = useState([]);
      const [isLoading, setIsLoading] = useState(true);
      const { toast } = useToast();
      const navigate = useNavigate();
      const barberShopWhatsappNumber = "554999617264"; 

      useEffect(() => {
        const fetchAppointments = () => {
          try {
            const storedAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
            
            const sortedAppointments = storedAppointments.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
              const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
              return dateA - dateB;
            });

            setAppointments(sortedAppointments);
          } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            toast({
              title: "Erro",
              description: "Não foi possível carregar os agendamentos.",
              variant: "destructive",
            });
          } finally {
            setIsLoading(false);
          }
        };

        fetchAppointments();
      }, [toast]);

      const handleDeleteAppointment = (indexToDelete) => {
        try {
          const appointmentToDelete = appointments[indexToDelete];
          const updatedAppointments = appointments.filter((_, index) => index !== indexToDelete);
          localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
          setAppointments(updatedAppointments);
          toast({
            title: "Sucesso!",
            description: `Agendamento de ${appointmentToDelete.name} removido.`,
            variant: "default",
          });
        } catch (error) {
          console.error("Erro ao deletar agendamento:", error);
          toast({
            title: "Erro",
            description: "Não foi possível remover o agendamento.",
            variant: "destructive",
          });
        }
      };
      
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString; 
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      };

      const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado.",
          variant: "default",
        });
        navigate('/admin/login');
      };

      const handleWhatsAppConfirm = (appointment) => {
        const clientPhoneNumber = appointment.phone.replace(/\D/g, ''); 
        const message = encodeURIComponent(
          `Olá ${appointment.name}, seu agendamento na Barbearia Balen para ${Array.isArray(appointment.services) ? appointment.services.join(', ') : appointment.service} no dia ${formatDate(appointment.date)} às ${appointment.time} está confirmado! Valor total: R$ ${appointment.totalValue.toFixed(2).replace('.', ',')}. Aguardamos você!`
        );
        
        let whatsappUrl;
        if (clientPhoneNumber) {
           whatsappUrl = `https://wa.me/${clientPhoneNumber}?text=${message}`;
        } else {
           whatsappUrl = `https://wa.me/${barberShopWhatsappNumber}?text=Confirmar agendamento para ${appointment.name} em ${formatDate(appointment.date)} às ${appointment.time}. Serviços: ${Array.isArray(appointment.services) ? appointment.services.join(', ') : appointment.service}. Valor: R$ ${appointment.totalValue.toFixed(2).replace('.', ',')}. Cliente não forneceu número para contato direto.`;
        }
        window.open(whatsappUrl, '_blank');
      };


      if (isLoading) {
        return (
          <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
            <p className="text-xl">Carregando agendamentos...</p>
          </div>
        );
      }

      return (
        <motion.div 
          className="container mx-auto px-4 py-8 min-h-screen bg-background text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Painel de Agendamentos</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Link to="/">Voltar ao Site</Link>
              </Button>
              <Button onClick={handleLogout} variant="destructive" className="hover:bg-destructive/80">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <motion.div 
              className="text-center py-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xl text-muted-foreground">Nenhum agendamento encontrado.</p>
              <img  
                alt="Barbeiro olhando para agenda vazia" 
                className="mx-auto mt-8 w-64 h-64 opacity-50"
               src="https://images.unsplash.com/photo-1519709009290-39959060630e" />
            </motion.div>
          ) : (
            <motion.div 
              className="overflow-x-auto bg-secondary p-4 md:p-6 rounded-lg shadow-xl border border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-b-primary/30">
                    <TableHead className="text-primary font-semibold min-w-[150px]">Cliente</TableHead>
                    <TableHead className="text-primary font-semibold min-w-[120px]">Telefone</TableHead>
                    <TableHead className="text-primary font-semibold min-w-[180px]">Serviços</TableHead>
                    <TableHead className="text-primary font-semibold min-w-[100px]">Data</TableHead>
                    <TableHead className="text-primary font-semibold min-w-[80px]">Hora</TableHead>
                    <TableHead className="text-primary font-semibold min-w-[100px]">Valor Total</TableHead>
                    <TableHead className="text-right text-primary font-semibold min-w-[150px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((app, index) => (
                    <motion.tr 
                      key={index} 
                      className="border-b-primary/10 hover:bg-primary/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium text-foreground py-3 md:py-4">{app.name}</TableCell>
                      <TableCell className="text-muted-foreground py-3 md:py-4">{app.phone}</TableCell>
                      <TableCell className="text-muted-foreground py-3 md:py-4">
                        {Array.isArray(app.services) ? app.services.join(', ') : app.service || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-3 md:py-4">{formatDate(app.date)}</TableCell>
                      <TableCell className="text-muted-foreground py-3 md:py-4">{app.time}</TableCell>
                      <TableCell className="text-muted-foreground py-3 md:py-4">R$ {app.totalValue ? app.totalValue.toFixed(2).replace('.', ',') : '0,00'}</TableCell>
                      <TableCell className="text-right py-3 md:py-4 space-x-1">
                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-500/80" onClick={() => handleWhatsAppConfirm(app)}>
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-secondary border-primary text-foreground">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-primary">Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Tem certeza que deseja excluir este agendamento para {app.name} em {formatDate(app.date)} às {app.time || 'N/A'}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-primary text-primary hover:bg-primary/10">Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteAppointment(index)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </motion.div>
      );
    };

    export default AdminDashboard;