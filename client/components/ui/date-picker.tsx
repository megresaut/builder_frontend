import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  onInputChange?: (input: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export const DatePicker = ({
  value,
  onChange,
  onInputChange,
  placeholder = "mm/dd/yyyy",
  disabled = false,
  error = false,
  className = "",
}: DatePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState<string>(
    value ? format(value, "MM/dd/yyyy") : "",
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(value || new Date());
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });

  // Format input as user types (mm/dd/yyyy)
  const formatDateInput = (input: string): string => {
    const digits = input.replace(/\D/g, "");
    const limited = digits.slice(0, 8);

    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  // Validate date format
  const validateDateFormat = (dateString: string): Date | null => {
    if (!dateString) return null;

    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return null;
    }

    const [month, day, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  };

  const handleInputChange = (newValue: string) => {
    const formatted = formatDateInput(newValue);
    setInputValue(formatted);
    onInputChange?.(formatted);

    if (formatted.length !== 10) {
      onChange(null);
      return;
    }

    const parsedDate = validateDateFormat(formatted);
    if (parsedDate) {
      onChange(parsedDate);
    } else {
      onChange(null);
    }
  };

  const getDaysInCurrentMonth = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(new Date(year, month, 1));
    const firstDayOfMonth = getDay(startOfMonth(new Date(year, month, 1)));

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setInputValue(format(date, "MM/dd/yyyy"));
    setShowCalendar(false);
  };

  const handleOpenCalendar = () => {
    if (!disabled && !showCalendar) {
      setShowCalendar(true);
      if (value) {
        setCalendarMonth(value);
      } else {
        setCalendarMonth(new Date());
      }

      // Calculate position
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setCalendarPos({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isClickInInput = inputRef.current?.contains(e.target as Node);
      const isClickInCalendar = calendarRef.current?.contains(e.target as Node);

      if (!isClickInInput && !isClickInCalendar) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const previousMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1),
    );
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleOpenCalendar}
        disabled={disabled}
        className={`ra-date-picker-input ${
          error ? "ra-date-picker-input--error" : ""
        } ${className}`}
      />
      <Calendar className="ra-date-picker-icon" aria-hidden="true" />

      {showCalendar &&
        createPortal(
          <div
            ref={calendarRef}
            className="ra-date-picker-calendar"
            style={{
              top: calendarPos.top + "px",
              left: calendarPos.left + "px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ra-date-picker-header">
              <button
                onClick={previousMonth}
                className="ra-date-picker-nav-btn"
                type="button"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="ra-date-picker-month-label">
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={nextMonth}
                className="ra-date-picker-nav-btn"
                type="button"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="ra-date-picker-weekdays">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="ra-date-picker-weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="ra-date-picker-days">
              {getDaysInCurrentMonth().map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (day !== null) {
                      const selected = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        day,
                      );
                      handleDateSelect(selected);
                    }
                  }}
                  disabled={day === null}
                  className={`ra-date-picker-day ${
                    value &&
                    value.getDate() === day &&
                    value.getMonth() === calendarMonth.getMonth() &&
                    value.getFullYear() === calendarMonth.getFullYear()
                      ? "ra-date-picker-day--selected"
                      : ""
                  } ${day === null ? "ra-date-picker-day--empty" : ""}`}
                  type="button"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
