package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.FooterSocialLink;

import java.util.List;

@Repository
public interface FooterSocialLinkRepository extends JpaRepository<FooterSocialLink, Long> {

    @Query("SELECT fsl FROM FooterSocialLink fsl WHERE fsl.footer.id = :footerId AND fsl.isActive = true ORDER BY fsl.displayOrder ASC")
    List<FooterSocialLink> findActiveSocialLinksByFooterId(@Param("footerId") Long footerId);

    @Query("SELECT fsl FROM FooterSocialLink fsl WHERE fsl.footer.id = :footerId ORDER BY fsl.displayOrder ASC")
    List<FooterSocialLink> findByFooterIdOrderByDisplayOrder(@Param("footerId") Long footerId);
}
