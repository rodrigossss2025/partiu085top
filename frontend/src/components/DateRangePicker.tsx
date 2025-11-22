import React from 'react';
import { DayPicker, SelectSingleEventHandler } from 'react-day-picker';
// ⚠️ CORREÇÃO: Linha de importação do CSS removida para evitar o erro do Vercel
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// --- Implementações simplificadas para evitar dependências não resolvidas ---
const cn = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ');

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
    <button
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
            "bg-white border border-gray-300 shadow-sm hover:bg-gray-100",
            className
        )}
        {...props}
    >
        {children}
    </button>
);

const Popover: React.FC<{children: React.ReactNode}> = ({ children }) => <div className="relative">{children}</div>;
const PopoverTrigger: React.FC<{children: React.ReactNode, asChild: boolean}> = ({ children }) => children as React.ReactElement;
const PopoverContent: React.FC<{children: React.ReactNode, className: string, align: string}> = ({ children, className }) => (
    <div className={cn("absolute z-50 mt-2 rounded-md border bg-white p-4 shadow-xl outline-none", className)}>
        {children}
    </div>
);
// --- Fim das Implementações simplificadas ---

interface DateRangePickerProps {
    data: Date | null;
    setData: (date: Date | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ data, setData }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect: SelectSingleEventHandler = (date) => {
        setData(date || null);
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col items-start space-y-2">
            <label className="text-sm font-medium text-gray-700">Data da Viagem</label>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        onClick={() => setIsOpen(!isOpen)}
                        id="date"
                        className={cn(
                            'w-[300px] justify-start text-left font-normal',
                            !data && 'text-gray-500'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {data ? (
                            format(data, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                            <span>Selecione a data</span>
                        )}
                    </Button>
                </PopoverTrigger>

                {isOpen && (
                    <PopoverContent className="w-auto p-0" align="start">
                        <DayPicker
                            mode="single"
                            selected={data || undefined}
                            onSelect={handleSelect}
                            locale={ptBR}
                            initialFocus
                            className="p-3"
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                caption: "flex justify-center pt-1 relative items-center",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 focus:bg-indigo-600",
                                day_today: "bg-gray-100",
                            }}
                        />
                    </PopoverContent>
                )}
            </Popover>
        </div>
    );
};

export default DateRangePicker;