import { useRef, useEffect, useState, useCallback } from "react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import styles from "./date-picker.module.css";

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
  const [positionAbove, setPositionAbove] = useState(false);

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

  // Calculate whether to show calendar above or below (with live updates)
  const checkPosition = useCallback(() => {
    if (showCalendar && inputRef.current && calendarRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const calendarHeight = calendarRef.current.offsetHeight || 340;
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;

      // Flip above if not enough space below (with 20px buffer)
      if (spaceBelow < calendarHeight + 20 && spaceAbove > calendarHeight + 20) {
        setPositionAbove(true);
      } else {
        setPositionAbove(false);
      }
    }
  }, [showCalendar]);

  // Listen for resize and scroll to detect when container shrinks
  useEffect(() => {
    if (!showCalendar) return;

    const resizeObserver = new ResizeObserver(checkPosition);
    const scrollHandler = () => checkPosition();

    // Watch the input and its parent containers for size changes
    if (inputRef.current) {
      resizeObserver.observe(inputRef.current);
      let parent = inputRef.current.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        resizeObserver.observe(parent);
        parent = parent.parentElement;
        depth++;
      }
    }

    // Listen for scroll on any parent that might be scrolling
    document.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", checkPosition);

    // Initial check
    checkPosition();

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", checkPosition);
    };
  }, [showCalendar, checkPosition]);

  // Handle ESC key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCalendar) {
        e.stopPropagation();
        e.preventDefault();
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
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
    <div className="relative" style={{ overflow: "visible" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleOpenCalendar}
        disabled={disabled}
        className={`${styles.input} ${
          error ? styles.inputError : ""
        } ${className}`}
      />
      <Calendar className={styles.icon} aria-hidden="true" />

      {showCalendar && (
        <div
          ref={calendarRef}
          className={styles.calendar}
          style={positionAbove ? {
            bottom: "calc(100% + 8px)",
            left: "0",
            position: "absolute",
            zIndex: 50,
          } : {
            top: "calc(100% + 8px)",
            left: "0",
            position: "absolute",
            zIndex: 50,
          }}
          onClick={(e) => e.stopPropagation()}
        >
            <div className={styles.header}>
              <button
                onClick={previousMonth}
                className={styles.navBtn}
                type="button"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={styles.monthLabel}>
                {format(calendarMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={nextMonth}
                className={styles.navBtn}
                type="button"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className={styles.weekdays}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className={styles.weekday}>
                  {day}
                </div>
              ))}
            </div>

            <div className={styles.days}>
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
                  className={`${styles.day} ${
                    value &&
                    value.getDate() === day &&
                    value.getMonth() === calendarMonth.getMonth() &&
                    value.getFullYear() === calendarMonth.getFullYear()
                      ? styles.daySelected
                      : ""
                  } ${day === null ? styles.dayEmpty : ""}`}
                  type="button"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};
