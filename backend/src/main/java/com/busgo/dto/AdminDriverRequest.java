package com.busgo.dto;

public class AdminDriverRequest {
    private String name;
    private String phoneNumber;
    private Integer experienceYears;
    private String licenseType;
    private Double rating;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public String getLicenseType() { return licenseType; }
    public void setLicenseType(String licenseType) { this.licenseType = licenseType; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
}
