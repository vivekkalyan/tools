import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SINGAPORE_TZ = "Asia/Singapore";
const SEATTLE_TZ = "America/Los_Angeles";
const SEARCH_WINDOW_MINUTES = 18 * 60;
const SEARCH_STEP_MINUTES = 15;

interface HourAlignment {
  hour: number;
  instant: Date | null;
  singaporeTime: string;
  singaporeDateLabel: string;
  seattleTime: string;
  seattleDateLabel: string;
  unavailable: boolean;
  seattleIsDay: boolean;
  singaporeIsDay: boolean;
}

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getTodayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentHourInTimeZone(timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
}

function parseIsoDate(isoDate: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function toPickerDate(isoDate: string): Date | undefined {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return undefined;

  return new Date(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return getTodayInTimeZone(SEATTLE_TZ);

  const instant = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
  instant.setUTCDate(instant.getUTCDate() + deltaDays);

  const year = instant.getUTCFullYear();
  const month = String(instant.getUTCMonth() + 1).padStart(2, "0");
  const day = String(instant.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDateTimeParts(instant: Date, timeZone: string): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const getPart = (partType: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === partType)?.value;
    return Number(value ?? "0");
  };

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

function findInstantFromLocalHour(isoDate: string, hour: number, timeZone: string): Date | null {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return null;

  const baseUtcMs = Date.UTC(parsed.year, parsed.month - 1, parsed.day, hour, 0, 0);

  for (
    let deltaMinutes = -SEARCH_WINDOW_MINUTES;
    deltaMinutes <= SEARCH_WINDOW_MINUTES;
    deltaMinutes += SEARCH_STEP_MINUTES
  ) {
    const candidate = new Date(baseUtcMs + deltaMinutes * 60_000);
    const local = getLocalDateTimeParts(candidate, timeZone);

    if (
      local.year === parsed.year &&
      local.month === parsed.month &&
      local.day === parsed.day &&
      local.hour === hour &&
      local.minute === 0
    ) {
      return candidate;
    }
  }

  return null;
}

function formatHourLabel(hour: number): string {
  const hour12 = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";
  return `${hour12}:00 ${period}`;
}

function getHourInTimeZone(instant: Date, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(instant),
  );
}

function isDayHour(hour: number): boolean {
  return hour >= 7 && hour < 19;
}

function formatTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

function formatDayAndDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(instant);
}

function formatLongDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(instant);
}

function getUtcOffsetLabel(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

function getCellSignalClass(isDay: boolean, unavailable: boolean): string {
  if (unavailable) return "bg-muted/20";
  return isDay ? "bg-amber-100/70 dark:bg-amber-900/25" : "bg-slate-900/10 dark:bg-slate-100/10";
}

export default function SeattleSingaporeTimeCheck() {
  const [selectedDate, setSelectedDate] = useState(() => getTodayInTimeZone(SEATTLE_TZ));
  const [selectedHour, setSelectedHour] = useState(() => getCurrentHourInTimeZone(SEATTLE_TZ));
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const selectedPickerDate = useMemo(() => toPickerDate(selectedDate), [selectedDate]);
  const selectedDateLabel = useMemo(() => {
    const parsed = parseIsoDate(selectedDate);
    if (!parsed) return "Pick a date";

    return formatLongDate(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0)), SEATTLE_TZ);
  }, [selectedDate]);

  const rows = useMemo<HourAlignment[]>(() => {
    const parsedDate = parseIsoDate(selectedDate);
    const fallbackDayLabel = parsedDate
      ? formatDayAndDate(new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day, 12, 0, 0)), SEATTLE_TZ)
      : "--";

    return Array.from({ length: 24 }, (_, hour) => {
      const instant = findInstantFromLocalHour(selectedDate, hour, SEATTLE_TZ);
      if (!instant) {
        return {
          hour,
          instant: null,
          singaporeTime: "--",
          singaporeDateLabel: "No matching hour (DST transition)",
          seattleTime: formatHourLabel(hour),
          seattleDateLabel: `${fallbackDayLabel} (skipped)`,
          unavailable: true,
          seattleIsDay: isDayHour(hour),
          singaporeIsDay: false,
        };
      }

      const seattleHour = getHourInTimeZone(instant, SEATTLE_TZ);
      const singaporeHour = getHourInTimeZone(instant, SINGAPORE_TZ);

      return {
        hour,
        instant,
        singaporeTime: formatTime(instant, SINGAPORE_TZ),
        singaporeDateLabel: formatDayAndDate(instant, SINGAPORE_TZ),
        seattleTime: formatTime(instant, SEATTLE_TZ),
        seattleDateLabel: formatDayAndDate(instant, SEATTLE_TZ),
        unavailable: false,
        seattleIsDay: isDayHour(seattleHour),
        singaporeIsDay: isDayHour(singaporeHour),
      };
    });
  }, [selectedDate]);

  const activeHour = hoveredHour ?? selectedHour;
  const activeRow = rows[activeHour] ?? null;
  const headerInstant = rows.find((row) => row.instant)?.instant ?? new Date();

  const singaporeOffset = getUtcOffsetLabel(headerInstant, SINGAPORE_TZ);
  const seattleOffset = getUtcOffsetLabel(headerInstant, SEATTLE_TZ);

  const jumpToTodayAndNow = () => {
    setSelectedDate(getTodayInTimeZone(SEATTLE_TZ));
    setSelectedHour(getCurrentHourInTimeZone(SEATTLE_TZ));
  };

  const shiftDateByDays = (deltaDays: number) => {
    setSelectedDate((current) => shiftIsoDate(current, deltaDays));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl">Seattle and Singapore Time Check</CardTitle>
            <CardDescription>
              Pick a Seattle date, then hover or click any hour to see the matching Singapore time. Rows are aligned to
              the same moment, with day/night color signals for quick scanning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="seattle-date-trigger">Date (Seattle)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => shiftDateByDays(-1)}
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="seattle-date-trigger"
                        variant="outline"
                        className={cn(
                          "w-[270px] justify-start text-left font-normal",
                          !selectedPickerDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {selectedDateLabel}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedPickerDate}
                        onSelect={(date) => {
                          if (date) setSelectedDate(toIsoDate(date));
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => shiftDateByDays(1)}
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" type="button" onClick={jumpToTodayAndNow}>
                Jump to now
              </Button>
            </div>

            <div className="mx-auto max-w-2xl rounded-lg border">
              <div className="grid grid-cols-2 border-b border-border/80 bg-muted/60 text-sm font-semibold">
                <div className="border-r border-border/80 px-3 py-2">Seattle ({seattleOffset})</div>
                <div className="px-3 py-2">Singapore ({singaporeOffset})</div>
              </div>

              <div className="divide-y divide-border/80">
                {rows.map((row) => {
                  const isActive = row.hour === activeHour;
                  const rowTone = isActive
                    ? "relative z-10 outline-2 -outline-offset-2 outline-primary"
                    : "hover:relative hover:z-10 hover:outline-2 hover:-outline-offset-2 hover:outline-border";

                  return (
                    <button
                      key={row.hour}
                      type="button"
                      className={`grid w-full grid-cols-2 text-left transition-colors ${rowTone}`}
                      onClick={() => setSelectedHour(row.hour)}
                      onMouseEnter={() => setHoveredHour(row.hour)}
                      onMouseLeave={() => setHoveredHour(null)}
                      onFocus={() => setHoveredHour(row.hour)}
                      onBlur={() => setHoveredHour(null)}
                    >
                      <div
                        className={cn(
                          "border-r border-border/80 px-3 py-2",
                          getCellSignalClass(row.seattleIsDay, row.unavailable),
                        )}
                      >
                        <p className="truncate text-sm font-semibold">
                          {row.seattleTime}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">{row.seattleDateLabel}</span>
                        </p>
                      </div>
                      <div className={cn("px-3 py-2", getCellSignalClass(row.singaporeIsDay, row.unavailable))}>
                        <p className="truncate text-sm font-semibold">
                          {row.singaporeTime}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {row.singaporeDateLabel}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeRow && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                {activeRow.unavailable ? (
                  <p className="text-sm">
                    <span className="font-semibold">{activeRow.seattleTime}</span> in Seattle is skipped on this date
                    due to a daylight saving time transition.
                  </p>
                ) : (
                  <p className="text-sm">
                    <span className="font-semibold">{activeRow.seattleTime}</span> in Seattle aligns with{" "}
                    <span className="font-semibold">{activeRow.singaporeTime}</span> in Singapore.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Seattle: {activeRow.seattleDateLabel} | Singapore: {activeRow.singaporeDateLabel}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
