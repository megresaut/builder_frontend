import { useRef, useState, useCallback, useEffect } from "react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Dropdown } from "./dropdown";
import { useGlobalActionsScrollLock } from "@/hooks/useGlobalActionsScrollLock";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState<string>(
    value ? format(value, "MM/dd/yyyy") : "",
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(value || new Date());
  const [isFirstFocus, setIsFirstFocus] = useState(true);

  // Apply scroll freeze when calendar is open
  useGlobalActionsScrollLock(showCalendar, {
    allowRefs: [inputRef, dropdownRef, calendarRef],
  });

  // Distance-based closing (150px threshold) - same as Popover
  useEffect(() => {
    if (!showCalendar || !calendarRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const calendar = calendarRef.current;
      if (!calendar) return;

      const calendarRect = calendar.getBoundingClientRect();

      const distX = Math.max(
        calendarRect.left - e.clientX,
        e.clientX - calendarRect.right,
        0,
      );
      const distY = Math.max(
        calendarRect.top - e.clientY,
        e.clientY - calendarRect.bottom,
        0,
      );
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance > 150) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [showCalendar]);

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

  const handleInputFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // Detect mobile device
      const isMobile =
        window.innerWidth < 1024 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;

      // On first focus on mobile, prevent keyboard by blurring then refocusing with readonly
      if (isMobile && isFirstFocus) {
        e.preventDefault();
        setIsFirstFocus(false);

        // Blur to close any keyboard
        e.currentTarget.blur();

        // Open calendar instead
        setShowCalendar(true);
      }
    },
    [isFirstFocus],
  );

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
    <Dropdown
      open={showCalendar}
      onOpenChange={setShowCalendar}
      initialPlacement="bottom"
      minSpaceBelow={340}
      offset={8}
      syncTriggerWidth={false}
    >
      <div className="relative" ref={dropdownRef}>
        <Dropdown.Trigger
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e: any) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          disabled={disabled}
          className={`${styles.input} ${error ? styles.inputError : ""} ${showCalendar ? "border-black" : ""} ${className}`}
          style={showCalendar ? { borderColor: "#000000" } : undefined}
        />
        <Calendar
          className={styles.icon}
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "0.5rem",
            top: "55%",
            transform: "translateY(-50%)",
            width: "1rem",
            height: "1rem",
            color: "#303030",
            pointerEvents: "none",
          }}
        />

        <Dropdown.Content
          closeOnOutsideClick={true}
          closeOnEscape={true}
          className={styles.calendar}
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
        </Dropdown.Content>
      </div>
    </Dropdown>
  );
};
