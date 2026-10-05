package com.busgo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReviewRequest {
    @NotNull @Min(1) @Max(5)
    private Integer rating;
    @NotNull @Min(1) @Max(5)
    private Integer cleanlinessRating;
    @NotNull @Min(1) @Max(5)
    private Integer comfortRating;
    @NotNull @Min(1) @Max(5)
    private Integer punctualityRating;
    @NotNull @Min(1) @Max(5)
    private Integer staffRating;
    @NotNull @Min(1) @Max(5)
    private Integer boardingRating;
    @NotBlank
    @Size(max = 150)
    private String title;
    @NotBlank
    private String text;

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Integer getCleanlinessRating() { return cleanlinessRating; }
    public void setCleanlinessRating(Integer cleanlinessRating) { this.cleanlinessRating = cleanlinessRating; }
    public Integer getComfortRating() { return comfortRating; }
    public void setComfortRating(Integer comfortRating) { this.comfortRating = comfortRating; }
    public Integer getPunctualityRating() { return punctualityRating; }
    public void setPunctualityRating(Integer punctualityRating) { this.punctualityRating = punctualityRating; }
    public Integer getStaffRating() { return staffRating; }
    public void setStaffRating(Integer staffRating) { this.staffRating = staffRating; }
    public Integer getBoardingRating() { return boardingRating; }
    public void setBoardingRating(Integer boardingRating) { this.boardingRating = boardingRating; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
