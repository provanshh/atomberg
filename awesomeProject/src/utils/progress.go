package utils

import (
	"math"
	"time"

	"awesomeProject/src/models"
)

type ProgressResult struct {
	Percentage float64 `json:"percentage"`
	Status     string  `json:"status"`
	Trend      string  `json:"trend"`
}

func CalculateProgress(uom models.UOMType, target, achievement float64, deadline *time.Time) ProgressResult {
	pct := 0.0
	switch uom {
	case models.UOMMin:
		if target > 0 {
			pct = (achievement / target) * 100
		}
	case models.UOMMax:
		if achievement > 0 {
			pct = (target / achievement) * 100
		}
	case models.UOMTimeline:
		if deadline == nil {
			pct = 0
		} else {
			total := deadline.Sub(time.Now().AddDate(0, 0, -90)).Hours()
			remaining := deadline.Sub(time.Now()).Hours()
			if total <= 0 {
				pct = 100
			} else {
				pct = ((total - remaining) / total) * 100
			}
		}
	case models.UOMZeroBase:
		if achievement == 0 {
			pct = 100
		}
	}

	if pct < 0 {
		pct = 0
	}
	if pct > 100 {
		pct = 100
	}
	pct = math.Round(pct*100) / 100

	status := "NOT_STARTED"
	trend := "FLAT"
	if pct >= 100 {
		status = "COMPLETED"
		trend = "UP"
	} else if pct >= 50 {
		status = "ON_TRACK"
		trend = "UP"
	} else if pct > 0 {
		status = "AT_RISK"
		trend = "DOWN"
	}
	return ProgressResult{Percentage: pct, Status: status, Trend: trend}
}
