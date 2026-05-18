package utils

import (
	"testing"
	"time"

	"awesomeProject/src/models"
)

func TestCalculateProgress_Min(t *testing.T) {
	r := CalculateProgress(models.UOMMin, 100, 25, nil)
	if r.Percentage != 25 {
		t.Fatalf("expected 25 got %.2f", r.Percentage)
	}
}

func TestCalculateProgress_ZeroBased(t *testing.T) {
	r := CalculateProgress(models.UOMZeroBase, 10, 0, nil)
	if r.Percentage != 100 {
		t.Fatalf("expected 100 got %.2f", r.Percentage)
	}
}

func TestCalculateProgress_Timeline(t *testing.T) {
	d := time.Now().Add(10 * 24 * time.Hour)
	r := CalculateProgress(models.UOMTimeline, 0, 0, &d)
	if r.Percentage < 0 || r.Percentage > 100 {
		t.Fatalf("timeline percentage out of range: %.2f", r.Percentage)
	}
}
